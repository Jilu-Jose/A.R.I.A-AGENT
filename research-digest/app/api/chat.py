import os
import json
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from app.api.auth import get_approved_user
from app.models import User
from pydantic import BaseModel
from typing import List

chat_router = APIRouter(prefix="/api/chat", tags=["chat"])

SYSTEM_PROMPT = (
    "You are A.R.I.A (Autonomous Research Intelligence Agent), a knowledgeable "
    "and concise research assistant. You help users understand research papers, "
    "summarise topics, explain concepts, and answer questions about science and technology. "
    "Keep your answers focused, clear, and well-structured. Use bullet points or "
    "numbered lists when appropriate."
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

@chat_router.post("")
def stream_chat(chat_request: ChatRequest, current_user: User = Depends(get_approved_user)):
    messages = [{"role": msg.role, "content": msg.content} for msg in chat_request.messages]
    if not messages:
        return StreamingResponse(iter(["data: [DONE]\n\n"]), media_type="text/event-stream")
        
    from agent.vectorstore import get_retriever
    
    user_message = messages[-1]["content"]
    
    context = ""
    retriever = get_retriever(current_user.id)
    if retriever:
        try:
            docs = retriever.invoke(user_message)
            if docs:
                context_parts = []
                for idx, doc in enumerate(docs):
                    title = doc.metadata.get("title", f"Source {idx+1}")
                    context_parts.append(f"[{title}]: {doc.page_content}")
                context = "\n\n".join(context_parts)
        except Exception as e:
            import loguru
            loguru.logger.error(f"RAG retrieval failed: {e}")

    def generate():
        import requests as req
        try:
            nvidia_api_key = os.environ.get("NVIDIA_API_KEY", "")
            url = f"{os.environ.get('NVIDIA_BASE_URL', 'https://integrate.api.nvidia.com/v1')}/chat/completions"
            headers = {
                "Authorization": f"Bearer {nvidia_api_key}",
                "Content-Type": "application/json"
            }
            
            formatted_messages = []
            system_content = SYSTEM_PROMPT
            if context:
                system_content += (
                    f"\n\nContext information is below.\n"
                    f"---------------------\n"
                    f"{context}\n"
                    f"---------------------\n"
                    f"Given the context information and no prior knowledge, answer the user's query."
                )
            formatted_messages.append({"role": "system", "content": system_content})
            formatted_messages.extend(messages)
                
            payload = {
                "model": os.environ.get("NVIDIA_MODEL", "moonshotai/kimi-k2.6"),
                "messages": formatted_messages,
                "stream": True,
            }
            
            with req.post(url, headers=headers, json=payload, stream=True, timeout=120) as resp:
                for line in resp.iter_lines():
                    if line:
                        decoded_line = line.decode("utf-8").strip()
                        if decoded_line.startswith("data: "):
                            data_str = decoded_line[6:]
                            if data_str == "[DONE]":
                                yield "data: [DONE]\n\n"
                                break
                            try:
                                chunk = json.loads(data_str)
                                token = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                if token:
                                    yield f"data: {json.dumps({'token': token})}\n\n"
                            except Exception:
                                continue
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"
        
    async def review_generate(topic):
        from agent.literature_review import stream_literature_review
        try:
            async for token in stream_literature_review(topic):
                yield f"data: {json.dumps({'token': token})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"
        
        
    async def gap_generate(topic):
        from agent.gap_finder import stream_gap_finder
        try:
            async for token in stream_gap_finder(topic):
                yield f"data: {json.dumps({'token': token})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"
        
    if user_message.strip().startswith("/review"):
        topic = user_message.replace("/review", "").strip()
        if not topic:
            topic = "recent AI advancements"
        return StreamingResponse(review_generate(topic), media_type="text/event-stream")
        
    if user_message.strip().startswith("/gap"):
        topic = user_message.replace("/gap", "").strip()
        if not topic:
            topic = "recent AI advancements"
        return StreamingResponse(gap_generate(topic), media_type="text/event-stream")
        
    async def collab_generate(topic):
        from agent.collaborator_finder import stream_collaborator_finder
        try:
            async for token in stream_collaborator_finder(topic):
                yield f"data: {json.dumps({'token': token})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"
        
    if user_message.strip().startswith("/collaborators"):
        topic = user_message.replace("/collaborators", "").strip()
        if not topic:
            topic = "AI researchers"
        return StreamingResponse(collab_generate(topic), media_type="text/event-stream")
        
    # If no explicit slash command, use semantic router
    from agent.router import route_query
    route = route_query(user_message)
    
    if route == "REVIEW":
        return StreamingResponse(review_generate(user_message), media_type="text/event-stream")
    elif route == "GAP":
        return StreamingResponse(gap_generate(user_message), media_type="text/event-stream")
    elif route == "COLLABORATORS":
        return StreamingResponse(collab_generate(user_message), media_type="text/event-stream")
        
    return StreamingResponse(generate(), media_type="text/event-stream")
