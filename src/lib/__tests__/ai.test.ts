import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  analyzeSkillsGap,
  evaluateInterviewAnswer,
  generateFinalReport,
  type PerQuestionResult,
} from '../ai'
import { invokeFunction } from '../edgeFunctions'
import { cache } from '../cache'

vi.mock('../edgeFunctions', () => ({
  invokeFunction: vi.fn(),
}))

const mockInvokeFunction = vi.mocked(invokeFunction)

describe('analyzeSkillsGap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cache.clear()
  })

  it('parses a valid JSON response and requests jsonMode', async () => {
    const aiResult = {
      gapAnalysis: { missingSkills: ['TypeScript'], skillsToImprove: [], strongSkills: [] },
      recommendations: [],
      careerPath: { nextSteps: [], timelineMonths: 6, salaryProjection: '' },
    }
    mockInvokeFunction.mockResolvedValue({ text: JSON.stringify(aiResult) })

    const result = await analyzeSkillsGap(['HTML'], 'Frontend Engineer', 'Mid Level', 'Tech')

    expect(result).toEqual(aiResult)
    expect(mockInvokeFunction).toHaveBeenCalledWith(
      'ai',
      expect.objectContaining({ jsonMode: true }),
    )
  })

  it('falls back to demo data when the response has no JSON', async () => {
    mockInvokeFunction.mockResolvedValue({ text: 'not json at all' })

    const result = await analyzeSkillsGap(['HTML'], 'Frontend Engineer', 'Mid Level', 'Tech') as Record<string, unknown>

    expect(result.isDemoData).toBe(true)
    expect(result.gapAnalysis).toBeDefined()
  })

  it('falls back to demo data when the response is missing required fields', async () => {
    mockInvokeFunction.mockResolvedValue({ text: JSON.stringify({ foo: 'bar' }) })

    const result = await analyzeSkillsGap(['HTML'], 'Frontend Engineer', 'Mid Level', 'Tech') as Record<string, unknown>

    expect(result.isDemoData).toBe(true)
  })

  it('caches successful results for identical inputs', async () => {
    const aiResult = {
      gapAnalysis: { missingSkills: [], skillsToImprove: [], strongSkills: [] },
      recommendations: [],
      careerPath: { nextSteps: [], timelineMonths: 6, salaryProjection: '' },
    }
    mockInvokeFunction.mockResolvedValue({ text: JSON.stringify(aiResult) })

    await analyzeSkillsGap(['HTML'], 'Frontend Engineer', 'Mid Level', 'Tech')
    await analyzeSkillsGap(['HTML'], 'Frontend Engineer', 'Mid Level', 'Tech')

    expect(mockInvokeFunction).toHaveBeenCalledTimes(1)
  })
})

describe('evaluateInterviewAnswer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('short-circuits with a clarification prompt for very short answers, without calling the API', async () => {
    const result = await evaluateInterviewAnswer('Tell me about yourself', 'idk', 'Engineer', undefined, 40)

    expect(result.status).toBe('needs_clarification')
    expect(mockInvokeFunction).not.toHaveBeenCalled()
  })

  it('returns a graceful fallback when the AI call fails with a quota error', async () => {
    mockInvokeFunction.mockRejectedValue({ message: '429 quota exceeded' })

    const longAnswer = 'This is a sufficiently long answer that describes a real situation in detail. '.repeat(2)
    const result = await evaluateInterviewAnswer('Tell me about yourself', longAnswer, 'Engineer', undefined, 40)

    expect(result.status).toBe('evaluated')
    const extended = result as unknown as { isDemoData: boolean; isQuotaExceeded: boolean }
    expect(extended.isDemoData).toBe(true)
    expect(extended.isQuotaExceeded).toBe(true)
  }, 15000)

  it('parses a valid evaluation response and requests jsonMode', async () => {
    const evaluation = {
      status: 'evaluated',
      score: 88,
      dimensions: { relevance: 22, specificity: 22, depth: 22, communication: 22 },
      strengths: ['Clear structure'],
      improvements: ['Add metrics'],
      interviewerResponse: 'Great answer.',
    }
    mockInvokeFunction.mockResolvedValue({ text: JSON.stringify(evaluation) })

    const longAnswer = 'This is a sufficiently long answer that describes a real situation in detail. '.repeat(2)
    const result = await evaluateInterviewAnswer('Tell me about yourself', longAnswer, 'Engineer', undefined, 40)

    expect(result).toEqual(evaluation)
    expect(mockInvokeFunction).toHaveBeenCalledWith(
      'ai',
      expect.objectContaining({ jsonMode: true }),
    )
  })
})

describe('generateFinalReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInvokeFunction.mockResolvedValue({ text: 'A concise two sentence summary of the interview performance.' })
  })

  const makeResult = (score: number): PerQuestionResult => ({
    questionIndex: 0,
    question: 'Q',
    answer: 'A',
    score,
    dimensions: { relevance: 20, specificity: 20, depth: 20, communication: 20 },
    keyFeedback: '',
  })

  it('grades a high-scoring interview as A+ with a Strong Yes recommendation', async () => {
    const report = await generateFinalReport('Engineer', 'mixed', [makeResult(95), makeResult(93)])

    expect(report.overallScore).toBe(94)
    expect(report.grade).toBe('A+')
    expect(report.hireRecommendation).toBe('Strong Yes')
  })

  it('grades a low-scoring interview as D with a No recommendation', async () => {
    const report = await generateFinalReport('Engineer', 'mixed', [makeResult(40), makeResult(30)])

    expect(report.overallScore).toBe(35)
    expect(report.grade).toBe('D')
    expect(report.hireRecommendation).toBe('No')
  })

  it('does not request jsonMode for the plain-text summary prompt', async () => {
    await generateFinalReport('Engineer', 'mixed', [makeResult(80)])

    expect(mockInvokeFunction).toHaveBeenCalledWith(
      'ai',
      expect.objectContaining({ jsonMode: false }),
    )
  })
})
