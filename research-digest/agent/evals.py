"""
agent/evals.py — LLM-as-a-Judge evaluation engine for A.R.I.A agents.

Metrics
-------
- faithfulness   : Does the output stick to what the source/context says?
- relevance      : Does the output directly answer the input question/topic?
- completeness   : Are all key aspects of the question addressed?
- coherence      : Is the output logically structured and easy to follow?
- insightfulness : Are the insights novel and non-trivial? (gap/trend agents)

Each agent maps to a subset of these metrics via AGENT_METRIC_MAP.
"""

import os
import sys
from loguru import logger
from pydantic import BaseModel, Field
from typing import Optional

# Ensure app path is loadable when run standalone
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langchain_openai import ChatOpenAI


# ---------------------------------------------------------------------------
# Shared data models
# ---------------------------------------------------------------------------

class EvalResult(BaseModel):
    score: int = Field(description="A score between 1 and 5.")
    reasoning: str = Field(description="Concise explanation for the score (1–2 sentences).")


class AgentEvalReport(BaseModel):
    """A collection of eval results for one agent invocation."""
    agent_name: str
    input_snapshot: str
    output_snapshot: str
    results: dict  # metric_name -> EvalResult


# ---------------------------------------------------------------------------
# Which metrics apply to which agent
# ---------------------------------------------------------------------------

AGENT_METRIC_MAP: dict[str, list[str]] = {
    "summarise":           ["faithfulness", "completeness", "coherence"],
    "paper_analyst":       ["faithfulness", "relevance", "completeness"],
    "literature_review":   ["faithfulness", "coherence", "relevance"],
    "gap_finder":          ["relevance", "insightfulness", "coherence"],
    "trend_detector":      ["relevance", "coherence"],
    "recommender":         ["relevance"],
    "citation_network":    ["faithfulness", "relevance"],
    "collaborator_finder": ["relevance"],
    "cluster":             ["coherence"],
    # fallback for any unknown agent
    "_default":            ["relevance", "coherence"],
}


# ---------------------------------------------------------------------------
# LLM factory
# ---------------------------------------------------------------------------

def _get_evaluator_llm() -> ChatOpenAI:
    base_url = os.environ.get("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
    model    = os.environ.get("NVIDIA_MODEL",    "moonshotai/kimi-k2-instruct")
    api_key  = os.environ.get("NVIDIA_API_KEY",  "")
    return ChatOpenAI(
        model=model,
        base_url=base_url,
        api_key=api_key,
        temperature=0.0,
    ).with_structured_output(EvalResult)


def _safe_invoke(llm, prompt: str, fallback_reason: str = "") -> EvalResult:
    """Invoke the evaluator LLM and return a safe fallback on failure."""
    try:
        return llm.invoke(prompt)
    except Exception as e:
        logger.error(f"Eval LLM call failed: {e}")
        return EvalResult(score=0, reasoning=fallback_reason or str(e))


# ---------------------------------------------------------------------------
# Individual metric functions
# ---------------------------------------------------------------------------

def evaluate_faithfulness(question: str, context: str, answer: str) -> EvalResult:
    """Does the answer stay faithful to the provided context (no hallucinations)?"""
    llm = _get_evaluator_llm()
    prompt = f"""You are an impartial evaluator assessing whether an AI assistant's answer is faithful to the provided context.
Faithfulness means the answer does not introduce information that is absent from or contradicts the context.

Question / Topic: {question}
Context (source material): {context[:2000]}
Answer: {answer[:2000]}

Score 1–5:
  1 = completely unfaithful / heavily hallucinated
  5 = perfectly faithful, every claim is grounded in the context.
"""
    return _safe_invoke(llm, prompt, "Faithfulness eval failed.")


def evaluate_relevance(question: str, answer: str) -> EvalResult:
    """Does the answer directly and usefully address the question/topic?"""
    llm = _get_evaluator_llm()
    prompt = f"""You are an impartial evaluator assessing whether an AI assistant's answer is relevant to the question or topic.
Relevance means the answer directly addresses what was asked without going off-topic.

Question / Topic: {question}
Answer: {answer[:2000]}

Score 1–5:
  1 = completely off-topic
  5 = perfectly on-topic and directly answers the question.
"""
    return _safe_invoke(llm, prompt, "Relevance eval failed.")


def evaluate_completeness(question: str, answer: str) -> EvalResult:
    """Does the answer cover all key aspects expected for this type of question?"""
    llm = _get_evaluator_llm()
    prompt = f"""You are an impartial evaluator assessing whether an AI assistant's answer is complete.
Completeness means all the key aspects that should be addressed for the given question or task are covered.

Question / Task: {question}
Answer: {answer[:2000]}

Score 1–5:
  1 = major parts of the question are ignored
  5 = thorough, no important aspect is missing.
"""
    return _safe_invoke(llm, prompt, "Completeness eval failed.")


def evaluate_coherence(answer: str) -> EvalResult:
    """Is the output logically structured and easy to follow?"""
    llm = _get_evaluator_llm()
    prompt = f"""You are an impartial evaluator assessing the coherence and readability of an AI assistant's response.
Coherence means the response is logically organized, flows naturally, and is easy to read.

Response: {answer[:2000]}

Score 1–5:
  1 = disorganised, hard to follow, contradictory
  5 = perfectly structured, clear, and logically consistent.
"""
    return _safe_invoke(llm, prompt, "Coherence eval failed.")


def evaluate_insightfulness(topic: str, answer: str) -> EvalResult:
    """Are the insights novel, non-obvious, and genuinely useful?"""
    llm = _get_evaluator_llm()
    prompt = f"""You are an impartial evaluator assessing how insightful an AI-generated research analysis is.
Insightfulness means the response surfaces non-obvious gaps, trends, or directions rather than restating common knowledge.

Topic: {topic}
Response: {answer[:2000]}

Score 1–5:
  1 = only restates obvious facts, no new insight
  5 = highly insightful, surfaces genuinely novel gaps or directions.
"""
    return _safe_invoke(llm, prompt, "Insightfulness eval failed.")


# ---------------------------------------------------------------------------
# Per-agent dispatcher
# ---------------------------------------------------------------------------

def run_agent_eval(
    agent_name: str,
    input_data: str,
    output_data: str,
    context: Optional[str] = None,
) -> AgentEvalReport:
    """
    Run all applicable metrics for *agent_name* and return an AgentEvalReport.

    Parameters
    ----------
    agent_name  : Canonical agent identifier (matches AGENT_METRIC_MAP keys).
    input_data  : The user query / topic / request sent to the agent.
    output_data : The agent's full response text.
    context     : Optional source context (used for faithfulness).
    """
    logger.info(f"[Eval] Starting evaluation for agent '{agent_name}'")

    metrics = AGENT_METRIC_MAP.get(agent_name, AGENT_METRIC_MAP["_default"])
    results: dict[str, EvalResult] = {}

    for metric in metrics:
        logger.debug(f"[Eval] Running '{metric}' for '{agent_name}'")
        if metric == "faithfulness":
            results[metric] = evaluate_faithfulness(input_data, context or output_data, output_data)
        elif metric == "relevance":
            results[metric] = evaluate_relevance(input_data, output_data)
        elif metric == "completeness":
            results[metric] = evaluate_completeness(input_data, output_data)
        elif metric == "coherence":
            results[metric] = evaluate_coherence(output_data)
        elif metric == "insightfulness":
            results[metric] = evaluate_insightfulness(input_data, output_data)

    logger.info(f"[Eval] Completed evaluation for '{agent_name}': {', '.join(f'{k}={v.score}' for k, v in results.items())}")

    return AgentEvalReport(
        agent_name=agent_name,
        input_snapshot=input_data[:500],
        output_snapshot=output_data[:500],
        results=results,
    )


# ---------------------------------------------------------------------------
# DB persistence helper (called from background tasks in agents.py)
# ---------------------------------------------------------------------------

def save_eval_to_db(
    report: AgentEvalReport,
    execution_id: Optional[int] = None,
):
    """Persist an AgentEvalReport into the database."""
    try:
        from app.database import SessionLocal
        from app.models import AgentEvalResult
        import datetime

        db = SessionLocal()
        try:
            for metric_name, eval_result in report.results.items():
                row = AgentEvalResult(
                    execution_id=execution_id,
                    agent_name=report.agent_name,
                    eval_type=metric_name,
                    score=eval_result.score,
                    reasoning=eval_result.reasoning,
                    input_snapshot=report.input_snapshot,
                    output_snapshot=report.output_snapshot,
                    created_at=datetime.datetime.now(datetime.timezone.utc),
                )
                db.add(row)
            db.commit()
            logger.info(f"[Eval] Saved {len(report.results)} eval rows for '{report.agent_name}' (exec_id={execution_id})")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"[Eval] Failed to save eval results to DB: {e}")


# ---------------------------------------------------------------------------
# Background task entry point — used by agents.py endpoints
# ---------------------------------------------------------------------------

def background_eval_task(
    agent_name: str,
    input_data: str,
    output_data: str,
    context: Optional[str] = None,
    execution_id: Optional[int] = None,
):
    """
    Convenience function to run eval + save in one call.
    Designed to be passed to FastAPI BackgroundTasks.
    """
    try:
        report = run_agent_eval(agent_name, input_data, output_data, context)
        save_eval_to_db(report, execution_id=execution_id)
    except Exception as e:
        logger.error(f"[Eval] background_eval_task crashed for '{agent_name}': {e}")


# ---------------------------------------------------------------------------
# Standalone smoke-test (python -m agent.evals)
# ---------------------------------------------------------------------------

def _run_smoke_test():
    logger.info("=== A.R.I.A Agent Evaluation Smoke Test ===")

    cases = [
        {
            "agent": "summarise",
            "input":  "Summarize papers on transformer attention mechanisms",
            "context": "Transformers use self-attention to weigh the importance of different tokens in a sequence.",
            "output": "- Transformers use self-attention to weigh token importance.\n- This enables parallel processing of sequences.\n- Attention heads capture different linguistic patterns.\n- The mechanism scales well with model size.",
        },
        {
            "agent": "gap_finder",
            "input":  "Research gaps in federated learning for healthcare",
            "context": None,
            "output": "There is limited work on differential privacy in federated learning for rare disease datasets. Most studies focus on common conditions, leaving rare disease model generalization unexplored.",
        },
    ]

    for tc in cases:
        logger.info(f"\n--- Agent: {tc['agent']} ---")
        report = run_agent_eval(tc["agent"], tc["input"], tc["output"], tc.get("context"))
        for metric, res in report.results.items():
            logger.info(f"  {metric}: {res.score}/5 — {res.reasoning}")

    logger.info("\n=== Smoke test complete ===")


if __name__ == "__main__":
    _run_smoke_test()
