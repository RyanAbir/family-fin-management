import { createHash } from "node:crypto";
import type {
  FinancialInsight,
  FinancialInsightDataset,
  FinancialInsightsResponse,
} from "@/types";

export const runtime = "nodejs";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const CACHE_TTL_MS = 1000 * 60 * 15;

interface CacheEntry {
  expiresAt: number;
  response: FinancialInsightsResponse;
}

interface OpenAITextContent {
  type?: string;
  text?: string;
}

interface OpenAIOutputItem {
  type?: string;
  content?: OpenAITextContent[];
}

interface OpenAIResponseBody {
  output_text?: string;
  output?: OpenAIOutputItem[];
  error?: {
    message?: string;
  };
}

const insightCache = new Map<string, CacheEntry>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toNumber = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

const sanitizeDataset = (value: unknown): FinancialInsightDataset | null => {
  if (!isRecord(value)) return null;

  const totals = isRecord(value.totals) ? value.totals : {};
  const generatedForMonth =
    typeof value.generatedForMonth === "string" ? value.generatedForMonth : new Date().toISOString().slice(0, 7);

  const monthlyTrends = Array.isArray(value.monthlyTrends)
    ? value.monthlyTrends.filter(isRecord).map((item) => ({
        month: typeof item.month === "string" ? item.month : "Unknown",
        income: toNumber(item.income),
        expense: toNumber(item.expense),
        net: toNumber(item.net),
      }))
    : [];

  const propertyPerformance = Array.isArray(value.propertyPerformance)
    ? value.propertyPerformance.filter(isRecord).map((item) => ({
        propertyName: typeof item.propertyName === "string" ? item.propertyName : "Unknown Property",
        income: toNumber(item.income),
        expense: toNumber(item.expense),
        net: toNumber(item.net),
      }))
    : [];

  const equityDistribution = Array.isArray(value.equityDistribution)
    ? value.equityDistribution.filter(isRecord).map((item) => ({
        memberName: typeof item.memberName === "string" ? item.memberName : "Unknown Member",
        amount: toNumber(item.amount),
      }))
    : [];

  const expenseByCategory = Array.isArray(value.expenseByCategory)
    ? value.expenseByCategory.filter(isRecord).map((item) => ({
        category: typeof item.category === "string" ? item.category : "Uncategorized",
        amount: toNumber(item.amount),
      }))
    : [];

  const incomeByCategory = Array.isArray(value.incomeByCategory)
    ? value.incomeByCategory.filter(isRecord).map((item) => ({
        category: typeof item.category === "string" ? item.category : "Uncategorized",
        amount: toNumber(item.amount),
      }))
    : [];

  const recentTransactions = Array.isArray(value.recentTransactions)
    ? value.recentTransactions.filter(isRecord).map((item) => ({
        type: item.type === "Expense" ? "Expense" as const : "Income" as const,
        category: typeof item.category === "string" ? item.category : "Uncategorized",
        amount: toNumber(item.amount),
        date: typeof item.date === "string" ? item.date : "",
      }))
    : [];

  return {
    generatedForMonth,
    totals: {
      income: toNumber(totals.income),
      expenses: toNumber(totals.expenses),
      net: toNumber(totals.net),
    },
    monthlyTrends,
    propertyPerformance,
    equityDistribution,
    expenseByCategory,
    incomeByCategory,
    recentTransactions,
  };
};

const cacheKeyFor = (dataset: FinancialInsightDataset): string =>
  createHash("sha256").update(JSON.stringify(dataset)).digest("hex");

const parseOutputText = (body: OpenAIResponseBody): string => {
  if (typeof body.output_text === "string") return body.output_text;

  const textParts = body.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter((text): text is string => typeof text === "string");

  return textParts?.join("\n").trim() ?? "";
};

const normalizeInsights = (value: unknown): FinancialInsight[] => {
  if (!isRecord(value) || !Array.isArray(value.insights)) return [];

  return value.insights.filter(isRecord).slice(0, 6).map((item) => {
    const category = item.category;
    const severity = item.severity;

    return {
      title: typeof item.title === "string" ? item.title.slice(0, 90) : "Financial observation",
      summary: typeof item.summary === "string" ? item.summary.slice(0, 500) : "Review this area for changes.",
      category:
        category === "income" ||
        category === "expense" ||
        category === "trend" ||
        category === "property" ||
        category === "equity" ||
        category === "savings"
          ? category
          : "trend",
      severity:
        severity === "positive" || severity === "warning" || severity === "info"
          ? severity
          : "info",
    };
  });
};

const fallbackInsights = (dataset: FinancialInsightDataset): FinancialInsight[] => {
  const topProperty = [...dataset.propertyPerformance].sort((a, b) => b.net - a.net)[0];
  const topExpense = [...dataset.expenseByCategory].sort((a, b) => b.amount - a.amount)[0];
  const latestMonth = dataset.monthlyTrends[dataset.monthlyTrends.length - 1];

  return [
    {
      title: topProperty ? `${topProperty.propertyName} leads net performance` : "Property performance needs more data",
      summary: topProperty
        ? `This property currently has the strongest net result at ${topProperty.net.toLocaleString()}. Compare maintenance and rent collection patterns before shifting investment decisions.`
        : "Add more income and expense entries to compare property performance reliably.",
      category: "property",
      severity: topProperty && topProperty.net > 0 ? "positive" : "info",
    },
    {
      title: topExpense ? `${topExpense.category} is the largest expense category` : "Expense categories are limited",
      summary: topExpense
        ? `${topExpense.category} totals ${topExpense.amount.toLocaleString()}. Review recent entries for recurring costs or one-off spikes.`
        : "Categorized expenses will make spending pattern analysis more useful.",
      category: "expense",
      severity: topExpense ? "warning" : "info",
    },
    {
      title: latestMonth ? `${latestMonth.month} net position is ${latestMonth.net >= 0 ? "positive" : "negative"}` : "Monthly trend data is unavailable",
      summary: latestMonth
        ? `Income was ${latestMonth.income.toLocaleString()} against expenses of ${latestMonth.expense.toLocaleString()}. Use this as the baseline for next month.`
        : "Record monthly activity to unlock trend observations.",
      category: "trend",
      severity: latestMonth && latestMonth.net >= 0 ? "positive" : "warning",
    },
  ];
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "AI insights are not configured. Add OPENAI_API_KEY on the server." },
      { status: 503 }
    );
  }

  const requestBody: unknown = await request.json().catch(() => null);
  const dataset = sanitizeDataset(isRecord(requestBody) ? requestBody.dataset : null);

  if (!dataset) {
    return Response.json({ error: "Invalid financial dataset." }, { status: 400 });
  }

  const cacheKey = cacheKeyFor(dataset);
  const cached = insightCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return Response.json({ ...cached.response, cached: true });
  }

  const prompt = [
    "Analyze this family finance dashboard dataset and return JSON only.",
    "Return exactly this shape: {\"insights\":[{\"title\":\"...\",\"summary\":\"...\",\"category\":\"income|expense|trend|property|equity|savings\",\"severity\":\"info|positive|warning\"}]}",
    "Create 4 to 6 concise, specific insights. Mention unusual expense increases, highest earning property, spending patterns, savings suggestions, monthly observations, and equity distribution when supported by the data.",
    "Do not invent facts beyond the dataset. Use plain language and practical recommendations.",
    JSON.stringify(dataset),
  ].join("\n\n");

  try {
    const openAiResponse = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_INSIGHTS_MODEL ?? "gpt-4.1-mini",
        input: prompt,
        max_output_tokens: 900,
      }),
    });

    const body = (await openAiResponse.json().catch(() => ({}))) as OpenAIResponseBody;

    if (!openAiResponse.ok) {
      const message = body.error?.message ?? "OpenAI request failed.";
      return Response.json({ error: message }, { status: 502 });
    }

    const outputText = parseOutputText(body);
    let parsedOutput: unknown = null;

    if (outputText) {
      try {
        parsedOutput = JSON.parse(outputText);
      } catch {
        parsedOutput = null;
      }
    }

    const insights = normalizeInsights(parsedOutput);
    const generatedInsights = insights.length > 0 ? insights : fallbackInsights(dataset);

    const response: FinancialInsightsResponse = {
      insights: generatedInsights,
      generatedAt: new Date().toISOString(),
      cached: false,
    };

    insightCache.set(cacheKey, {
      response,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return Response.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate AI insights.";
    return Response.json({ error: message }, { status: 502 });
  }
}
