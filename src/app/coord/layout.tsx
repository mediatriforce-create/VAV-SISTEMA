import DashboardLayout from '../dashboard/layout';

export default function CoordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
