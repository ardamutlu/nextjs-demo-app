"use client";

import { signIn } from "next-auth/react";
import { Trans, useT } from "next-i18next/client";
import { CircleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertIcon, AlertTitle } from "@/components/ui/alert";
import { SIGN_IN_TEST_IDS } from "../../../../tests/helpers/sign-in-test-ids";

export default function Page() {
  const { t } = useT();

  return (
    <div className="flex flex-col gap-6">
      <Card className="w-full max-w-100">
        <CardContent className="p-6 space-y-5">
          <div className="space-y-1.5">
            <h1
              className="text-2xl font-semibold tracking-tight text-center"
              data-testid={SIGN_IN_TEST_IDS.title}
            >
              {t("signIn", { ns: "common" })}
            </h1>
          </div>

          <Alert size="sm" close={false}>
            <AlertIcon>
              <CircleAlert className="text-primary" />
            </AlertIcon>
            <AlertTitle className="text-accent-foreground">
              <Trans
                ns="sign-in"
                i18nKey="signInGithubHint"
                components={{
                  1: <span className="text-mono font-semibold" />,
                }}
              />
            </AlertTitle>
          </Alert>

          <Button
            data-testid={SIGN_IN_TEST_IDS.githubButton}
            type="button"
            variant="outline"
            className="w-full"
            onClick={async () => await signIn("github", { redirectTo: "/" })}
          >
            {t("signInWithGithub", { ns: "sign-in" })}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
