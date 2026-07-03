import os
import sys
from loguru import logger
from pydantic import BaseModel, Field

# Ensure app path is loaded
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langchain_openai import ChatOpenAI

class EvalResult(BaseModel):
    score: int = Field(description="A score between 1 and 5.")
    reasoning: str = Field(description="Explanation for the score.")

def get_evaluator_llm():
    base_url = os.environ.get("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
    model = os.environ.get("NVIDIA_MODEL", "moonshotai/kimi-k2.6")
    api_key = os.environ.get("NVIDIA_API_KEY", "")
    return ChatOpenAI(
        model=model,
        base_url=base_url,
        api_key=api_key,
        temperature=0.0,
    ).with_structured_output(EvalResult)

def evaluate_faithfulness(question: str, context: str, answer: str) -> EvalResult:
    llm = get_evaluator_llm()
    prompt = f"""
    You are an impartial evaluator assessing whether an AI assistant's answer is faithful to the provided context.
    Faithfulness means the answer does not hallucinate information outside of the context.
    
    Question: {question}
    Context: {context}
    Answer: {answer}
    
    Score 1 to 5, where 1 means completely unfaithful/hallucinated, and 5 means perfectly faithful.
    """
    try:
        return llm.invoke(prompt)
    except Exception as e:
        logger.error(f"Eval failed: {e}")
        return EvalResult(score=0, reasoning=str(e))

def evaluate_relevance(question: str, answer: str) -> EvalResult:
    llm = get_evaluator_llm()
    prompt = f"""
    You are an impartial evaluator assessing whether an AI assistant's answer is relevant to the question.
    Relevance means it directly answers what was asked without dodging the question.
    
    Question: {question}
    Answer: {answer}
    
    Score 1 to 5, where 1 means completely irrelevant, and 5 means perfectly answers the question.
    """
    try:
        return llm.invoke(prompt)
    except Exception as e:
        logger.error(f"Eval failed: {e}")
        return EvalResult(score=0, reasoning=str(e))

def run_evals():
    logger.info("Starting LLM-as-a-Judge Evaluation Pipeline...")
    
    test_cases = [
        {
            "question": "What is the capital of France?",
            "context": "Paris is the capital and most populous city of France.",
            "answer": "The capital of France is Paris.",
            "expected_faithfulness_high": True,
            "expected_relevance_high": True
        },
        {
            "question": "What is the capital of France?",
            "context": "Paris is the capital and most populous city of France.",
            "answer": "The capital of France is London, known for the Eiffel Tower.",
            "expected_faithfulness_high": False,
            "expected_relevance_high": True
        },
        {
            "question": "What is the capital of France?",
            "context": "Paris is the capital and most populous city of France.",
            "answer": "I like to eat apples and bananas.",
            "expected_faithfulness_high": False,
            "expected_relevance_high": False
        }
    ]
    
    for i, tc in enumerate(test_cases):
        logger.info(f"--- Test Case {i+1} ---")
        f_res = evaluate_faithfulness(tc["question"], tc["context"], tc["answer"])
        r_res = evaluate_relevance(tc["question"], tc["answer"])
        
        logger.info(f"Faithfulness: {f_res.score}/5 - {f_res.reasoning}")
        logger.info(f"Relevance: {r_res.score}/5 - {r_res.reasoning}")
        
    logger.info("Evaluations complete.")

if __name__ == "__main__":
    run_evals()
