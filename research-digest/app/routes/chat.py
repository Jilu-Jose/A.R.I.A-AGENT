"""
Chat routes for A.R.I.A.

Provides a conversational interface powered by the same local Ollama model
used for digest summarisation. Supports streaming responses via SSE.
"""

import os
import json
from flask import Blueprint, render_template, request, Response, stream_with_context
from flask_login import login_required

chat_bp = Blueprint("chat", __name__)

SYSTEM_PROMPT = (
    "You are A.R.I.A (Autonomous Research Intelligence Agent), a knowledgeable "
    "and concise research assistant. You help users understand research papers, "
    "summarise topics, explain concepts, and answer questions about science and technology. "
    "Keep your answers focused, clear, and well-structured. Use bullet points or "
    "numbered lists when appropriate."
)


def _get_ollama_url():
    return os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")


def _get_model():
    return os.environ.get("OLLAMA_MODEL", "qwen2.5:0.5b")


@chat_bp.route("/chat")
@login_required
def index():
    """Render the A.R.I.A chat interface."""
    return render_template("chat.html")


@chat_bp.route("/api/chat", methods=["POST"])
@login_required
def stream_chat():
    """Stream a chat response from Ollama using Server-Sent Events."""
    data = request.get_json()
    messages = data.get("messages", [])

    if not messages:
        return Response("data: [DONE]\n\n", mimetype="text/event-stream")

    # Build the prompt with conversation history
    history_text = ""
    for msg in messages[:-1]:  # All but the last (current question)
        role = "User" if msg["role"] == "user" else "A.R.I.A"
        history_text += f"{role}: {msg['content']}\n"

    user_message = messages[-1]["content"]

    full_prompt = (
        f"System: {SYSTEM_PROMPT}\n\n"
        f"{history_text}"
        f"User: {user_message}\n"
        f"A.R.I.A:"
    )

    def generate():
        import requests as req
        try:
            ollama_url = f"{_get_ollama_url()}/api/generate"
            payload = {
                "model": _get_model(),
                "prompt": full_prompt,
                "stream": True,
            }

            with req.post(ollama_url, json=payload, stream=True, timeout=120) as resp:
                for line in resp.iter_lines():
                    if line:
                        try:
                            chunk = json.loads(line.decode("utf-8"))
                            token = chunk.get("response", "")
                            if token:
                                yield f"data: {json.dumps({'token': token})}\n\n"
                            if chunk.get("done"):
                                yield "data: [DONE]\n\n"
                                break
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
