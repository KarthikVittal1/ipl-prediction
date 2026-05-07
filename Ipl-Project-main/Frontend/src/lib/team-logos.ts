// IPL 2026 franchise metadata. Logos use Wikipedia hosted assets.
export interface TeamMeta {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  color: string;
  homeVenueId: string;
}

export const TEAMS: Record<string, TeamMeta> = {
  csk: {
    id: "csk",
    name: "Chennai Super Kings",
    shortName: "CSK",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/2/2b/Chennai_Super_Kings_Logo.svg",
    color: "#F9CD05",
    homeVenueId: "chepauk",
  },
  mi: {
    id: "mi",
    name: "Mumbai Indians",
    shortName: "MI",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/c/cd/Mumbai_Indians_Logo.svg",
    color: "#004BA0",
    homeVenueId: "wankhede",
  },
  rcb: {
    id: "rcb",
    name: "Royal Challengers Bengaluru",
    shortName: "RCB",
    logoUrl: "https://upload.wikimedia.org/wikipedia/ta/thumb/9/9a/Royal_Challengers_Bangalore_Logo_2016.svg/250px-Royal_Challengers_Bangalore_Logo_2016.svg.png?_=20191208082142",
    color: "#EC1C24",
    homeVenueId: "chinnaswamy",
  },
  kkr: {
    id: "kkr",
    name: "Kolkata Knight Riders",
    shortName: "KKR",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/4/4c/Kolkata_Knight_Riders_Logo.svg",
    color: "#3A225D",
    homeVenueId: "eden",
  },
  dc: {
    id: "dc",
    name: "Delhi Capitals",
    shortName: "DC",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/2/2f/Delhi_Capitals.svg",
    color: "#17449B",
    homeVenueId: "kotla",
  },
  srh: {
    id: "srh",
    name: "Sunrisers Hyderabad",
    shortName: "SRH",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/5/51/Sunrisers_Hyderabad_Logo.svg/500px-Sunrisers_Hyderabad_Logo.svg.png",
    color: "#FB643E",
    homeVenueId: "uppal",
  },
  pbks: {
    id: "pbks",
    name: "Punjab Kings",
    shortName: "PBKS",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/d/d4/Punjab_Kings_Logo.svg",
    color: "#D71920",
    homeVenueId: "mohali",
  },
  rr: {
    id: "rr",
    name: "Rajasthan Royals",
    shortName: "RR",
    logoUrl: "https://upload.wikimedia.org/wikipedia/hi/thumb/6/60/Rajasthan_Royals_Logo.svg/960px-Rajasthan_Royals_Logo.svg.png?_=20180328051431",
    color: "#EA1A85",
    homeVenueId: "sawai",
  },
  gt: {
    id: "gt",
    name: "Gujarat Titans",
    shortName: "GT",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/0/09/Gujarat_Titans_Logo.svg",
    color: "#1B2133",
    homeVenueId: "narendra",
  },
  lsg: {
    id: "lsg",
    name: "Lucknow Super Giants",
    shortName: "LSG",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/3/34/Lucknow_Super_Giants_Logo.svg/500px-Lucknow_Super_Giants_Logo.svg.png",
    color: "#A72056",
    homeVenueId: "ekana",
  },
};

export const teamRef = (id: string) => {
  const t = TEAMS[id];
  return { id: t.id, name: t.name, shortName: t.shortName, logoUrl: t.logoUrl };
};
