import { useParams } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import PartnerProfile from "@/pages/partner/Profile";

export default function AdminProviderEditor() {
    const { id } = useParams();
    const isNew = !id || id === 'new';

    console.log("AdminProviderEditor - id:", id, "isNew:", isNew);

    return (
        <AdminLayout>
            <PartnerProfile providerIdProp={isNew ? undefined : id} isNewProp={isNew} />
        </AdminLayout>
    );
}
