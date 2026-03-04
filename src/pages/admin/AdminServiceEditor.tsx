import { useParams } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import PartnerServiceEditor from "@/pages/partner/ServiceEditor";

export default function AdminServiceEditor() {
    const { id: providerId, serviceId } = useParams();
    const isNew = !serviceId || serviceId === 'new';

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                <PartnerServiceEditor
                    providerIdProp={providerId}
                    serviceIdProp={isNew ? undefined : serviceId}
                    isNewProp={isNew}
                />
            </div>
        </AdminLayout>
    );
}
