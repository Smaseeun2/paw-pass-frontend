export const migrateGuestRoutes = (user) => {
  if (!user) return;
  const guestRoutesJson = localStorage.getItem('paw_pass_routes_guest');
  if (guestRoutesJson) {
    const userEmail = user.email || user.id;
    if (userEmail) {
      const targetKey = `paw_pass_routes_${userEmail}`;
      const existingRoutes = JSON.parse(localStorage.getItem(targetKey) || '[]');
      try {
        const guestRoutes = JSON.parse(guestRoutesJson);
        const merged = [...existingRoutes];
        guestRoutes.forEach(gRoute => {
          if (!merged.some(r => String(r.id || r.contentId) === String(gRoute.id || gRoute.contentId))) {
            merged.push(gRoute);
          }
        });
        localStorage.setItem(targetKey, JSON.stringify(merged));
      } catch (err) {
        console.error('게스트 동선 마이그레이션 실패:', err);
      } finally {
        localStorage.removeItem('paw_pass_routes_guest');
      }
    }
  }
};
