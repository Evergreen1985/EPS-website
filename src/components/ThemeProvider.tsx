import { getSchoolConfig } from "@/lib/getSchoolConfig";

export default async function ThemeProvider() {
  const school = await getSchoolConfig();
  const { theme } = school;

  const css = `
:root {
  --color-primary:   ${theme.primaryColor};
  --color-secondary: ${theme.secondaryColor};
  --color-accent:    ${theme.accentColor};
  --color-dark:      ${theme.darkColor};
  --color-light-bg:  ${theme.lightBg};
  --font-heading:    '${theme.fontHeading}', sans-serif;
  --font-body:       '${theme.fontBody}', sans-serif;
}`.trim();

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
