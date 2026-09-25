import React, { useState } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Briefcase,
  Target,
  ArrowRight,
  RefreshCw,
  Award,
  XCircle,
  HelpCircle
} from 'lucide-react';

export default function ResumeManager({
  token,
  resumeInfo,
  onRefreshResume,
  onSelectRoleForPractice
}) {
  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  // Job Fit Analysis State
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzingFit, setIsAnalyzingFit] = useState(false);
  const [fitResult, setFitResult] = useState(null);
  const [fitError, setFitError] = useState(null);

  // Role Suggestions State
  const [isGeneratingRoles, setIsGeneratingRoles] = useState(false);
  const [roleSuggestions, setRoleSuggestions] = useState(null);
  const [roleError, setRoleError] = useState(null);

  /**
   * Handle File Selection and local validation
   */
  const handleFileChange = (e) => {
    setUploadError(null);
    setUploadSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check extension
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      setUploadError('Only .pdf and .docx files are supported.');
      setSelectedFile(null);
      return;
    }

    // Check 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds the 5MB size limit.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  /**
   * Upload resume to POST /api/resume/upload
   */
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('resume', selectedFile);

    try {
      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload resume.');
      }

      setUploadSuccess(`Resume "${data.fileName}" uploaded and parsed successfully!`);
      setSelectedFile(null);
      if (onRefreshResume) {
        onRefreshResume();
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Run Fit Analysis against target Job Description
   */
  const handleFitAnalysis = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;

    setIsAnalyzingFit(true);
    setFitError(null);
    setFitResult(null);

    try {
      const response = await fetch('/api/resume/fit-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ jobDescription: jobDescription.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze job fit.');
      }

      setFitResult(data);
    } catch (err) {
      console.error('Fit analysis error:', err);
      setFitError(err.message || 'Error analyzing job fit.');
    } finally {
      setIsAnalyzingFit(false);
    }
  };

  /**
   * Request Role Suggestions based on stored resume
   */
  const handleRoleSuggestions = async () => {
    setIsGeneratingRoles(true);
    setRoleError(null);

    try {
      const response = await fetch('/api/resume/role-suggestions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate role suggestions.');
      }

      setRoleSuggestions(data.recommendations || []);
    } catch (err) {
      console.error('Role suggestions error:', err);
      setRoleError(err.message || 'Error generating role suggestions.');
    } finally {
      setIsGeneratingRoles(false);
    }
  };

  const hasStoredResume = Boolean(resumeInfo?.hasResume);

  return (
    <div className="max-w-4xl w-full mx-auto py-6 animate-fade-in space-y-8">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-2">
          <FileText className="w-3.5 h-3.5" />
          Resume Intelligence (Phase 3)
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
          Resume & Career Intelligence
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Upload your resume once to unlock tailored interview questions, evaluate alignment with job descriptions, and discover recommended technical roles.
        </p>
      </div>

      {/* 1. Resume Upload & Status Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-400" />
              {hasStoredResume ? 'Current Resume Stored' : 'Upload Your Resume'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports standard <strong>.pdf</strong> or <strong>.docx</strong> files (up to 5MB).
            </p>
          </div>

          {hasStoredResume && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{resumeInfo.fileName}</span>
            </div>
          )}
        </div>

        {/* Success message banner */}
        {uploadSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Error message banner */}
        {uploadError && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <label className="flex-1 cursor-pointer">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500/60 text-slate-300 text-xs transition-all">
              <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">
                {selectedFile ? selectedFile.name : hasStoredResume ? 'Choose a new file to replace resume...' : 'Select a .pdf or .docx resume...'}
              </span>
            </div>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/30 transition-all shrink-0"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Parsing & Storing...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>{hasStoredResume ? 'Replace Resume' : 'Upload Resume'}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 2. Role Suitability Recommendations Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Role Suitability Recommendations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Let the AI analyze your resume projects and technologies to suggest optimal roles.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRoleSuggestions}
            disabled={!hasStoredResume || isGeneratingRoles}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-all shadow-sm disabled:opacity-50 shrink-0"
          >
            {isGeneratingRoles ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                <span>Analyzing Profile...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Suggest Roles For Me</span>
              </>
            )}
          </button>
        </div>

        {/* Missing resume alert */}
        {!hasStoredResume && (
          <p className="text-xs text-slate-500 italic">
            Please upload a resume above to enable AI role suitability analysis.
          </p>
        )}

        {/* Role Error */}
        {roleError && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{roleError}</span>
          </div>
        )}

        {/* Role Suggestions Result Cards */}
        {roleSuggestions && roleSuggestions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-2 animate-fade-in">
            {roleSuggestions.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between hover:border-indigo-500/40 transition-all space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-sm text-slate-100 truncate">
                      {item.role}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Match
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.reasoning}
                  </p>
                </div>

                {onSelectRoleForPractice && (
                  <button
                    type="button"
                    onClick={() => onSelectRoleForPractice(item.role)}
                    className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 pt-2 border-t border-slate-800/80 transition-colors"
                  >
                    <span>Practice This Role</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Job Description Fit Analysis Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            Job Description Fit Analysis
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Paste a target job posting below to assess alignment, matching strengths, and missing requirements.
          </p>
        </div>

        <form onSubmit={handleFitAnalysis} className="space-y-4">
          <textarea
            rows={5}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            disabled={!hasStoredResume}
            placeholder={
              hasStoredResume
                ? 'Paste a job description or list of requirements here (e.g., "Seeking a Backend Engineer proficient in Node.js, PostgreSQL, Docker, AWS...")...'
                : 'Upload your resume first to enable job description fit analysis...'
            }
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none disabled:opacity-50"
            required
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!hasStoredResume || !jobDescription.trim() || isAnalyzingFit}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/30 transition-all"
            >
              {isAnalyzingFit ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Evaluating Fit...</span>
                </>
              ) : (
                <>
                  <Target className="w-3.5 h-3.5" />
                  <span>Check Fit</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Fit Analysis Error */}
        {fitError && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{fitError}</span>
          </div>
        )}

        {/* Fit Analysis Results Display */}
        {fitResult && (
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 animate-fade-in">
            {/* Top Score Banner */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Overall Resume Match Score
              </span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                <Award className="w-4 h-4 text-indigo-400" />
                <span className="font-extrabold text-base text-indigo-300">
                  {fitResult.fitScore}
                </span>
              </div>
            </div>

            {/* Matching & Missing Skills Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Matching Skills */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Matching Skills & Requirements</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {fitResult.matchingSkills?.length > 0 ? (
                    fitResult.matchingSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No specific direct skill matches detected.</span>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Missing or Unmentioned Requirements</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {fitResult.missingSkills?.length > 0 ? (
                    fitResult.missingSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No critical missing skills identified.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actionable Suggestions */}
            {fitResult.suggestions && (
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Actionable Recommendations</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {fitResult.suggestions}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
