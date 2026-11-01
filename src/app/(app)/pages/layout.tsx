import { PagesLayout } from "@/features/pages/pages-layout";

export default function Layout({ children }: LayoutProps<"/pages">) {
  return <PagesLayout>{children}</PagesLayout>;
}
