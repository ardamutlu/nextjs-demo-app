import { toast } from "sonner";
import { Row } from "@tanstack/react-table";
import { useT } from "next-i18next/client";
import { CircleCheck, Ellipsis } from "lucide-react";
import { Alert, AlertIcon, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { Repository } from "@/types/repositories";

export function ActionsCell({ row }: { row: Row<Repository> }) {
  const { t } = useT("repositories");
  const { copyToClipboard } = useCopyToClipboard();
  const handleCopyId = () => {
    copyToClipboard(row.original.clone_url);
    const message = `Copied: ${row.original.clone_url}`;
    toast.custom(
      (t) => (
        <Alert
          variant="mono"
          icon="primary"
          close={false}
          onClose={() => toast.dismiss(t)}
        >
          <AlertIcon>
            <CircleCheck />
          </AlertIcon>
          <AlertTitle>{message}</AlertTitle>
        </Alert>
      ),
      {
        position: "top-center",
        duration: 2000,
      },
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Open Dropdown"
          className="size-7"
          mode="icon"
          variant="ghost"
        >
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full" side="bottom" align="end">
        <DropdownMenuItem onClick={() => window.open(row.original.html_url)}>
          {t("openGithubPage")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyId}>
          {t("copyUrl")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
