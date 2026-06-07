import Project from "../models/Project.js";

export async function getAdminStats(req, res) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalViews,
      top5,
      addedThisMonth,
      totalProjects,
      totalFavorites,
    ] = await Promise.all([
      // Somme de toutes les vues
      Project.aggregate([
        { $match: { type: "mapping" } },
        { $group: { _id: null, total: { $sum: "$views" } } },
      ]),

      // Top 5 projets les plus vus
      Project.find({ type: "mapping" })
        .sort({ views: -1 })
        .limit(5)
        .select("title slug views stats.favorites")
        .lean(),

      // Projets ajoutés ce mois-ci
      Project.countDocuments({
        type: "mapping",
        createdAt: { $gte: startOfMonth },
      }),

      // Total projets publiés
      Project.countDocuments({ type: "mapping", status: "published" }),

      // Total favoris
      Project.aggregate([
        { $match: { type: "mapping" } },
        { $group: { _id: null, total: { $sum: "$stats.favorites" } } },
      ]),
    ]);

    // Vues par jour sur les 30 derniers jours (basé sur publishedAt comme proxy)
    const dailyViews = await Project.aggregate([
      { $match: { type: "mapping", createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          views: { $sum: "$views" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.json({
      totalViews: totalViews[0]?.total ?? 0,
      totalProjects,
      addedThisMonth,
      totalFavorites: totalFavorites[0]?.total ?? 0,
      top5: top5.map((p) => ({
        _id: p._id,
        title: p.title,
        slug: p.slug,
        views: p.views ?? 0,
        favorites: p.stats?.favorites ?? 0,
      })),
      dailyViews: dailyViews.map((d) => ({ date: d._id, views: d.views, projects: d.count })),
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}
