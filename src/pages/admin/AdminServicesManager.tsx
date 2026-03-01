import { useParams } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import PartnerServices from "@/pages/partner/Services";

export default function AdminServicesManager() {
    const { id: providerId } = useParams();

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                <PartnerServices providerIdProp={providerId} />
            </div>
        </AdminLayout>
    );
}
