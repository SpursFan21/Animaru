//Animaru\src\app\admins\banners\page.tsx

import AdminShell from "../_components/AdminShell";
import {
  listBannerSlotsAction,
  listEligibleAnimeAction,
} from "./actions";
import BannerManagerClient from "./BannerManagerClient";

export const metadata = { title: "Banner Manager | Admin" };

export default async function Page() {
  const [slots, eligible] = await Promise.all([
    listBannerSlotsAction(),
    listEligibleAnimeAction(),
  ]);

  return (
    <AdminShell
      title="Banner Manager"
      subtitle="Pick up to 5 anime and set their rotation order for the homepage."
    >
      <BannerManagerClient initialSlots={slots} eligibleAnime={eligible} />
    </AdminShell>
  );
}
