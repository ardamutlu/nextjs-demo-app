import {
  DataGridApiFetchParams,
  DataGridApiResponse,
} from "@/components/ui/data-grid";
import { Repository } from "@/types/repositories";

export const fetchGithubSearchRepositories = async ({
  pageIndex,
  pageSize,
  sorting,
  searchQuery,
  selectedLanguages,
}: DataGridApiFetchParams & {
  selectedLanguages: string[];
}): Promise<DataGridApiResponse<Repository>> => {
  const sortField = sorting?.[0]?.id || "";
  const sortDirection = sorting?.[0]?.desc ? "desc" : "asc";
  const langField =
    selectedLanguages.length > 0
      ? ` language:${selectedLanguages.map((lang) => lang).join(" language:")}`
      : "";

  const params = new URLSearchParams({
    page: String(pageIndex + 1),
    per_page: String(pageSize),
    ...(sortField ? { sort: sortField, order: sortDirection } : {}),
    ...(searchQuery || langField ? { q: `${searchQuery}${langField}` } : {}),
  });

  return fetch(
    `https://api.github.com/search/repositories?${params.toString()}`,
  )
    .then((res) => res.json())
    .then((data) => ({
      data: data.items,
      empty: data.items.length === 0,
      pagination: {
        total: data.total_count,
        page: pageIndex,
      },
    }));
};
