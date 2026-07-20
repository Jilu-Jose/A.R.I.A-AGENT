import os
import json
from flask import Blueprint, render_template, request, Response, stream_with_context
from flask_login import login_required
from app.routes.auth import approved_required
chat_bp = Blueprint("chat", __name__)
SYSTEM_PROMPT = (
    "You are A.R.I.A (Autonomous Research Intelligence Agent), a knowledgeable "
    "and concise research assistant. You help users understand research papers, "
    "summarise topics, explain concepts, and answer questions about science and technology. "
    "Keep your answers focused, clear, and well-structured. Use bullet points or "
    "numbered lists when appropriate."
)

@chat_bp.route("/chat")
@approved_required
def index():
    return render_template("chat.html")
@chat_bp.route("/api/chat", methods=["POST"])
@approved_required
def stream_chat():
    data = request.get_json()
    messages = data.get("messages", [])
    if not messages:
        return Response("data: [DONE]\n\n", mimetype="text/event-stream")
        
    from flask_login import current_user
    from agent.vectorstore import get_retriever

    user_message = messages[-1]["content"]
    
    # RAG Retrieval
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

    # Use NVIDIA NIM API (OpenAI-compatible)
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
            
            for msg in messages:
                formatted_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
                
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
                
    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )
