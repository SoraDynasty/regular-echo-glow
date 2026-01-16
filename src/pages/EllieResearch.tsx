import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, History, ExternalLink, ChevronRight, Trash2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Source {
  url: string;
  title: string;
  snippet?: string;
}

interface ResearchResult {
  answer: string;
  sources: Source[];
  relatedQuestions: string[];
}

interface ResearchHistory {
  id: string;
  query: string;
  response: string;
  sources: unknown;
  related_questions: unknown;
  created_at: string;
}

const EllieResearch = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch research history
  const { data: history = [] } = useQuery({
    queryKey: ["research-history"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("research_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return (data || []) as ResearchHistory[];
      
      if (error) throw error;
      return data as ResearchHistory[];
    },
  });

  // Save research mutation
  const saveResearch = useMutation({
    mutationFn: async ({ query, result }: { query: string; result: ResearchResult }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("research_history")
        .insert([{
          user_id: user.id,
          query,
          response: result.answer,
          sources: JSON.parse(JSON.stringify(result.sources)),
          related_questions: JSON.parse(JSON.stringify(result.relatedQuestions)),
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-history"] });
    },
  });

  // Delete research mutation
  const deleteResearch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("research_history")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-history"] });
      toast({ title: "Research deleted" });
    },
  });

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("ellie-research", {
        body: { query: searchQuery },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      const researchResult = data.data as ResearchResult;
      setResult(researchResult);
      saveResearch.mutate({ query: searchQuery, result: researchResult });
    } catch (error) {
      console.error("Research error:", error);
      toast({
        title: "Research failed",
        description: "Unable to complete your research. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const loadFromHistory = (item: ResearchHistory) => {
    setQuery(item.query);
    setResult({
      answer: item.response,
      sources: (item.sources as Source[]) || [],
      relatedQuestions: (item.related_questions as string[]) || [],
    });
    setSidebarOpen(false);
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  // Parse citations in the answer
  const renderAnswerWithCitations = (answer: string, sources: Source[]) => {
    const parts = answer.split(/(\[\d+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const citationIndex = parseInt(match[1]) - 1;
        const source = sources[citationIndex];
        if (source) {
          return (
            <a
              key={index}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-ellie-primary text-white rounded-full hover:bg-ellie-primary/80 transition-colors mx-0.5"
            >
              {match[1]}
            </a>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-ellie-bg flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-ellie-secondary transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static`}
      >
        <div className="flex items-center justify-between p-4 border-b border-ellie-secondary">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-ellie-primary" />
            <h2 className="font-semibold text-gray-800">Recent Research</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-65px)]">
          <div className="p-2 space-y-1">
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 p-3">No research history yet</p>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-2 p-3 rounded-lg hover:bg-ellie-secondary/50 cursor-pointer transition-colors"
                  onClick={() => loadFromHistory(item)}
                >
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate flex-1">
                    {item.query}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteResearch.mutate(item.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3 text-gray-400" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center gap-4 p-4 border-b border-ellie-secondary bg-white">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ellie-primary to-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Ellie</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="ml-auto text-gray-600"
          >
            Back
          </Button>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-8 overflow-auto">
          {!result && !isSearching ? (
            /* Home Screen */
            <div className="max-w-2xl mx-auto mt-16 lg:mt-24">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-ellie-primary to-purple-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-ellie-primary/30">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                  Hi, I'm Ellie! ✨
                </h2>
                <p className="text-gray-600 text-lg">
                  What can Ellie help you find today?
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="relative"
              >
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full h-14 pl-5 pr-14 text-lg rounded-full border-2 border-ellie-secondary focus:border-ellie-primary bg-white shadow-sm"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-2 top-2 w-10 h-10 rounded-full bg-ellie-primary hover:bg-ellie-primary/90"
                >
                  <Search className="w-5 h-5 text-white" />
                </Button>
              </form>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {[
                  "What's happening in tech today?",
                  "Explain quantum computing",
                  "Best productivity tips",
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery(suggestion);
                      handleSearch(suggestion);
                    }}
                    className="rounded-full border-ellie-secondary hover:bg-ellie-secondary hover:text-ellie-primary"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            /* Results Screen */
            <div className="max-w-3xl mx-auto">
              {/* Search Bar (compact) */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="relative mb-6"
              >
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask another question..."
                  className="w-full h-12 pl-4 pr-12 rounded-full border-2 border-ellie-secondary focus:border-ellie-primary bg-white"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isSearching}
                  className="absolute right-1.5 top-1.5 w-9 h-9 rounded-full bg-ellie-primary hover:bg-ellie-primary/90"
                >
                  <Search className="w-4 h-4 text-white" />
                </Button>
              </form>

              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ellie-primary to-purple-400 flex items-center justify-center animate-pulse mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-600">Researching...</p>
                </div>
              ) : result ? (
                <div className="space-y-6">
                  {/* Sources Row */}
                  {result.sources.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Sources
                      </h3>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {result.sources.map((source, index) => (
                          <a
                            key={index}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-ellie-secondary hover:border-ellie-primary hover:shadow-sm transition-all"
                          >
                            {getFaviconUrl(source.url) && (
                              <img
                                src={getFaviconUrl(source.url)!}
                                alt=""
                                className="w-4 h-4"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                              />
                            )}
                            <span className="text-sm text-gray-700 max-w-[150px] truncate">
                              {source.title}
                            </span>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Answer Card */}
                  <Card className="p-6 bg-white border-ellie-secondary">
                    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {renderAnswerWithCitations(result.answer, result.sources)}
                    </div>
                  </Card>

                  {/* Related Questions */}
                  {result.relatedQuestions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Related Questions
                      </h3>
                      <div className="space-y-2">
                        {result.relatedQuestions.map((question, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            className="w-full justify-between h-auto py-3 px-4 bg-ellie-secondary/50 hover:bg-ellie-secondary text-left rounded-xl"
                            onClick={() => {
                              setQuery(question);
                              handleSearch(question);
                            }}
                          >
                            <span className="text-gray-700">{question}</span>
                            <ChevronRight className="w-4 h-4 text-ellie-primary flex-shrink-0" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EllieResearch;
