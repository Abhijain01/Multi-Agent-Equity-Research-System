"""
agents/news_agent.py

The News Agent — fetches recent company news via NewsAPI
and uses Groq to extract sentiment and key events.

LangGraph role:
  Runs in PARALLEL with web_researcher and financial_data after orchestrator.
  Receives state with company populated.
  Returns {"news_data": [...]}

Flow:
  get_news(company) → format articles → one Groq call for sentiment + key events
"""

import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from alphaagents.graph.state import ResearchState
from alphaagents.tools.news import get_news
from alphaagents.utils.prompts import NEWS_AGENT_PROMPT

load_dotenv()

# ── Output schema ─────────────────────────────────────────────────────────────

class KeyEvent(BaseModel):
    """A single significant news event."""
    headline: str = Field(description="One-line description of the event")
    significance: str = Field(
        description="Why this matters for the stock — 1 sentence"
    )
    source_url: str = Field(description="URL of the article reporting this event")
    published_at: str = Field(description="Publication date (YYYY-MM-DD format)")


class NewsOutput(BaseModel):
    """Structured output from the news agent."""
    sentiment: str = Field(
        description="Overall market sentiment: must be exactly one of: 'positive', 'neutral', 'negative'"
    )
    sentiment_reason: str = Field(
        description="One sentence explaining why the sentiment is positive/neutral/negative"
    )
    key_events: list[KeyEvent] = Field(
        description="Top 3 most significant news events from the last 7 days. Maximum 3."
    )
    has_news: bool = Field(
        description="True if there was meaningful news, False if no significant news found"
    )


# ── LLM client ────────────────────────────────────────────────────────────────

_llm = None

def _get_llm():
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0,
            api_key=os.getenv("GROQ_API_KEY"),
        )
    return _llm


def _format_articles_for_prompt(articles: list[dict]) -> str:
    """Format raw news articles into a clean text block for the LLM."""
    if not articles:
        return "No articles found in the last 7 days."

    lines = []
    for i, a in enumerate(articles[:10], 1):  # cap at 10 articles
        lines.append(
            f"[{i}] Title: {a.get('title', 'N/A')}\n"
            f"    Source: {a.get('source', 'N/A')}\n"
            f"    Date: {a.get('published_at', 'N/A')[:10]}\n"
            f"    Description: {a.get('description', 'N/A')}\n"
            f"    URL: {a.get('url', 'N/A')}"
        )
    return "\n\n".join(lines)


# ── Agent function ────────────────────────────────────────────────────────────

def news_agent_node(state: ResearchState) -> dict:
    """
    LangGraph node: fetches news and extracts sentiment + key events.

    Args:
        state: ResearchState with company populated

    Returns:
        {"news_data": list[dict]} — sentiment + key events as list of dicts
    """
    company = state.get("company", "")

    if not company:
        print("[NEWS AGENT] No company in state. Skipping.")
        return {"news_data": []}

    print(f"\n[NEWS AGENT] Fetching news for {company} (last 7 days)")

    # 1. Fetch articles (cached after first call)
    articles = get_news(company, days=7)
    print(f"[NEWS AGENT] Retrieved {len(articles)} articles")

    # 2. Format articles for LLM
    articles_text = _format_articles_for_prompt(articles)

    # 3. Ask Groq to extract sentiment + key events
    llm = _get_llm()
    structured_llm = llm.with_structured_output(NewsOutput)

    messages = [
        SystemMessage(content=NEWS_AGENT_PROMPT),
        HumanMessage(content=(
            f"Company: {company}\n\n"
            f"Recent news articles (last 7 days):\n{articles_text}\n\n"
            f"Extract the overall sentiment and the top 3 most significant events. "
            f"Only use information from the articles above — do not add external knowledge."
        )),
    ]

    print(f"[NEWS AGENT] Analysing sentiment and key events with Groq...")

    try:
        result: NewsOutput = structured_llm.invoke(messages)
    except Exception as e:
        print(f"[NEWS AGENT] ⚠️  Groq call failed: {e}")
        return {"news_data": [{
            "sentiment": "neutral",
            "sentiment_reason": "News analysis failed due to an error.",
            "key_events": [],
            "has_news": False,
            "error": str(e),
        }]}

    # 4. Convert to list of dicts for state
    news_data = [{
        "sentiment": result.sentiment,
        "sentiment_reason": result.sentiment_reason,
        "has_news": result.has_news,
        "key_events": [
            {
                "headline": event.headline,
                "significance": event.significance,
                "source_url": event.source_url,
                "published_at": event.published_at,
            }
            for event in result.key_events
        ],
        "raw_articles_count": len(articles),
    }]

    print(f"[NEWS AGENT] ✅ Sentiment: {result.sentiment} | Key events: {len(result.key_events)}")
    return {"news_data": news_data}


# ── Manual test ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from alphaagents.graph.state import get_initial_state

    state = get_initial_state("Analyse HDFC Bank for a retail investor")
    state["company"] = "HDFC Bank"
    state["ticker"] = "HDFCBANK.NS"

    result = news_agent_node(state)

    print("\n" + "=" * 50)
    print("NEWS AGENT OUTPUT")
    print("=" * 50)
    if result["news_data"]:
        nd = result["news_data"][0]
        print(f"Sentiment  : {nd.get('sentiment')}")
        print(f"Reason     : {nd.get('sentiment_reason')}")
        print(f"Has news   : {nd.get('has_news')}")
        print(f"\nKey Events:")
        for i, event in enumerate(nd.get("key_events", []), 1):
            print(f"\n  [{i}] {event['headline']}")
            print(f"       Why it matters: {event['significance']}")
            print(f"       Source: {event['source_url']}")