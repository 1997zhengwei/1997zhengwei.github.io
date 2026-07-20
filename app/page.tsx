"use client";

import {
  Atom,
  ArrowRight,
  ArrowSquareOut,
  EnvelopeSimple,
  GraduationCap,
  List,
  MapPin,
  X,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";

type Language = "en" | "zh";

const scholarUrl =
  "https://scholar.google.com/citations?user=9f5NYs4AAAAJ&hl=zh-CN&oi=sra";

const copy = {
  en: {
    skip: "Skip to main content",
    brand: "Wei Zheng",
    nav: [
      ["about", "About"],
      ["research", "Research"],
      ["publications", "Publications"],
      ["experience", "Experience"],
      ["honors", "Honors"],
      ["contact", "Contact"],
    ],
    menuOpen: "Open navigation",
    menuClose: "Close navigation",
    heroEyebrow: "Postdoctoral Fellow · Antennas, Electromagnetics & 6G",
    heroTitle: "Wei Zheng",
    heroDescription:
      "Researching leaky-wave and reconfigurable antennas, holographic focusing, millimeter-wave / terahertz arrays, and metamaterials for next-generation wireless systems.",
    primaryCta: "View research",
    scholarCta: "Google Scholar",
    portraitAlt: "Professional portrait of Wei Zheng",
    visualAlt:
      "Wei Zheng with antenna radiation patterns and electromagnetic measurement figures",
    stats: [
      ["89", "Citations"],
      ["5", "h-index"],
      ["3", "i10-index"],
      ["24", "Publications"],
    ],
    dataNote: "Scholar data checked 2026-07-21",
    focusLabel: "Research focus",
    research: [
      {
        number: "01",
        title: "Leaky-wave antennas",
        description: "Broadband scanning · multibeam radiation · high efficiency",
      },
      {
        number: "02",
        title: "Reconfigurable antennas",
        description: "Switchable beams · polarization diversity · smart surfaces",
      },
      {
        number: "03",
        title: "Holographic focusing",
        description: "Near-field control · wavefront synthesis · numerical holography",
      },
      {
        number: "04",
        title: "mmWave / THz & metamaterials",
        description: "Array antennas · flexible metasurfaces · 6G hardware",
      },
    ],
    aboutKicker: "Profile",
    aboutTitle: "Engineering controllable electromagnetic waves",
    aboutBody: [
      "I am a postdoctoral fellow in the Department of Electrical Engineering at POSTECH. My research connects antenna engineering, electromagnetic theory, and emerging wireless systems — from fixed-frequency beam scanning to holographic focusing and terahertz arrays.",
      "I received my Ph.D. in Electronic Science and Technology from Beijing Jiaotong University in 2025. Across journal papers, patents, and collaborative projects, I focus on turning rigorous electromagnetic models into compact, efficient, and experimentally validated hardware.",
    ],
    aboutFacts: [
      ["Current", "POSTECH · Pohang, South Korea"],
      ["Fields", "Antennas · Electromagnetics · Wave propagation"],
      ["Service", "Reviewer for 7 international journals"],
      ["Patents", "4 granted Chinese invention patents"],
    ],
    researchKicker: "Selected directions",
    researchTitle: "From field theory to working antennas",
    researchIntro:
      "Four connected research threads define my current work. Each combines analytical models, full-wave simulation, prototyping, and measurement.",
    publicationsKicker: "Selected publications",
    publicationsTitle: "First- and corresponding-author work",
    publicationsIntro:
      "A selection from 15 SCI journal papers and 9 conference papers. Citation counts and the complete record are available on Google Scholar.",
    papers: [
      {
        year: "2023",
        title:
          "A Leaky Wave Antenna With Capability of Fixed-Frequency Beamforming Scanning",
        venue: "IEEE Transactions on Antennas and Propagation · 71(9), 7585–7590",
        note: "First author · TAP Hot Article · 19 citations",
        doi: "https://doi.org/10.1109/TAP.2023.3280747",
      },
      {
        year: "2025",
        title:
          "A Dual-Beam SIW Leaky-Wave Antenna With Butterfly-Shaped Slot and Suppressed Open Stopband",
        venue: "IEEE Transactions on Antennas and Propagation",
        note: "First author · Two spatial harmonics",
        doi: "https://doi.org/10.1109/TAP.2025.3531140",
      },
      {
        year: "2024",
        title:
          "A Compact Broadband Loop Complementary Source Antenna With Switchable Tilted Beams",
        venue: "IEEE Transactions on Vehicular Technology · 74(2), 2323–2337",
        note: "First author · Intelligent communication",
        doi: "https://doi.org/10.1109/TVT.2024.3474058",
      },
      {
        year: "2024",
        title:
          "A Broadband Quad-Beam Patched Leaky-Wave Antenna Based on Substrate-Integrated Coaxial Line",
        venue: "IEEE Antennas and Wireless Propagation Letters · 23(12), 4748–4752",
        note: "First author · Multibeam applications",
        doi: "https://doi.org/10.1109/LAWP.2024.3469191",
      },
      {
        year: "2025",
        title:
          "A Broadband Metasurface-Loaded Leaky-Wave Antenna Based on SICL",
        venue: "IEEE Antennas and Wireless Propagation Letters · 24(10), 3549–3553",
        note: "First author · Enhanced millimeter-wave efficiency",
        doi: "https://doi.org/10.1109/LAWP.2025.3595895",
      },
    ],
    allPublications: "View complete publication record",
    experienceKicker: "Experience & education",
    experienceTitle: "Research across three institutions",
    timeline: [
      {
        date: "2025.10 — Present",
        role: "Postdoctoral Fellow · Electrical Engineering",
        place: "Pohang University of Science and Technology (POSTECH)",
        detail:
          "3D holographic focusing, high-power microwave technology, packaged antennas, and 6G millimeter-wave / terahertz array antennas.",
      },
      {
        date: "2025.07 — 2025.10",
        role: "Research Assistant · School of Science and Engineering",
        place: "The Chinese University of Hong Kong, Shenzhen",
        detail:
          "Epsilon-near-zero geometrically independent circuits and antennas, and non-reciprocal microwave systems.",
      },
      {
        date: "2020.09 — 2025.06",
        role: "Ph.D. · Electronic Science and Technology",
        place: "Beijing Jiaotong University",
        detail:
          "Leaky-wave antennas, reconfigurable and broadband antennas, and metamaterial technology. Supervisor: Prof. Junhong Wang.",
      },
      {
        date: "2019.09 — 2020.08",
        role: "M.Eng. · Electronic Science and Technology",
        place: "Beijing Jiaotong University",
        detail: "Graduate study in antenna theory and electromagnetic engineering.",
      },
    ],
    honorsKicker: "Honors & service",
    honorsTitle: "Academic service, scholarships, and funded research",
    awardsTitle: "Scholarships",
    awards: [
      "China Scholarship Council Scholarship",
    ],
    serviceTitle: "Academic service",
    service:
      "Reviewer for IEEE TAP, IEEE Antennas and Propagation Magazine, IEEE AWPL, IEEE OJAP, IEEE TCPMT, Electronics Letters, and IET Microwaves, Antennas & Propagation, as well as international conferences.",
    projectsTitle: "Project experience",
    projects:
      "Contributed to National Natural Science Foundation key projects and the National Key R&D Program on radio-wave coverage, communication–sensing–transmission antennas, deformable electromagnetic skins, scattering reduction, and beamforming.",
    contactKicker: "Contact",
    contactTitle: "Let’s explore the next wave together.",
    contactBody:
      "I welcome conversations about antennas, electromagnetics, 6G hardware, joint research, and academic collaboration.",
    emailLabel: "Email",
    locationLabel: "Location",
    location: "POSTECH · Pohang, South Korea",
    footer:
      "Wei Zheng · Antennas, Electromagnetics & 6G · Bilingual academic profile",
  },
  zh: {
    skip: "跳转到主要内容",
    brand: "郑伟",
    nav: [
      ["about", "简介"],
      ["research", "研究"],
      ["publications", "论文"],
      ["experience", "经历"],
      ["honors", "荣誉"],
      ["contact", "联系"],
    ],
    menuOpen: "打开导航",
    menuClose: "关闭导航",
    heroEyebrow: "博士后研究员 · 天线、电磁与6G",
    heroTitle: "郑伟",
    heroDescription:
      "聚焦漏波与可重构天线、全息聚焦、毫米波/太赫兹阵列及超材料，面向下一代无线系统研究可控电磁波技术。",
    primaryCta: "查看研究",
    scholarCta: "谷歌学术",
    portraitAlt: "郑伟的职业头像",
    visualAlt: "郑伟与天线辐射方向图、电磁测试结果",
    stats: [
      ["89", "总引用"],
      ["5", "h指数"],
      ["3", "i10指数"],
      ["24", "论文"],
    ],
    dataNote: "学术数据核对于 2026-07-21",
    focusLabel: "研究重点",
    research: [
      {
        number: "01",
        title: "漏波天线",
        description: "宽带扫描 · 多波束辐射 · 高效率",
      },
      {
        number: "02",
        title: "可重构天线",
        description: "波束切换 · 极化分集 · 智能表面",
      },
      {
        number: "03",
        title: "全息聚焦",
        description: "近场调控 · 波前综合 · 数值全息",
      },
      {
        number: "04",
        title: "毫米波/太赫兹与超材料",
        description: "阵列天线 · 柔性超表面 · 6G硬件",
      },
    ],
    aboutKicker: "个人简介",
    aboutTitle: "让电磁波精确、可控并走向应用",
    aboutBody: [
      "现为韩国浦项科技大学电气工程系博士后研究员。我的研究连接天线工程、电磁理论和新型无线系统，从定频波束扫描延伸到全息聚焦与太赫兹阵列。",
      "2025年于北京交通大学获得电子科学与技术博士学位。通过期刊论文、发明专利和合作项目，我持续将严谨的电磁模型转化为紧凑、高效且经过实验验证的天线与微波硬件。",
    ],
    aboutFacts: [
      ["现任", "韩国浦项科技大学 · 浦项"],
      ["领域", "天线 · 电磁 · 电波传播"],
      ["学术服务", "7本国际期刊审稿人"],
      ["专利", "已授权中国发明专利4项"],
    ],
    researchKicker: "研究方向",
    researchTitle: "从电磁场理论到可测试天线",
    researchIntro:
      "当前工作由四条相互关联的研究线索构成，并贯穿理论分析、全波仿真、样机加工与实验测试。",
    publicationsKicker: "代表性论文",
    publicationsTitle: "第一/通信作者成果",
    publicationsIntro:
      "从已发表的15篇SCI期刊论文和9篇会议论文中选取部分代表作；完整记录与引用信息请见谷歌学术。",
    papers: [
      {
        year: "2023",
        title: "具备定频波束赋形扫描能力的漏波天线",
        venue: "IEEE Transactions on Antennas and Propagation · 71(9), 7585–7590",
        note: "第一作者 · TAP热点文章 · 19次引用",
        doi: "https://doi.org/10.1109/TAP.2023.3280747",
      },
      {
        year: "2025",
        title: "基于双空间谐波辐射的蝶形槽双波束SIW漏波天线",
        venue: "IEEE Transactions on Antennas and Propagation",
        note: "第一作者 · 开放阻带抑制",
        doi: "https://doi.org/10.1109/TAP.2025.3531140",
      },
      {
        year: "2024",
        title: "面向智能通信的可切换倾斜波束宽带环形互补源天线",
        venue: "IEEE Transactions on Vehicular Technology · 74(2), 2323–2337",
        note: "第一作者 · 智能通信",
        doi: "https://doi.org/10.1109/TVT.2024.3474058",
      },
      {
        year: "2024",
        title: "基于基片集成同轴线的宽带四波束贴片漏波天线",
        venue: "IEEE Antennas and Wireless Propagation Letters · 23(12), 4748–4752",
        note: "第一作者 · 多波束应用",
        doi: "https://doi.org/10.1109/LAWP.2024.3469191",
      },
      {
        year: "2025",
        title: "基于SICL、开放阻带受抑且效率增强的宽带超表面漏波天线",
        venue: "IEEE Antennas and Wireless Propagation Letters · 24(10), 3549–3553",
        note: "第一作者 · 毫米波效率提升",
        doi: "https://doi.org/10.1109/LAWP.2025.3595895",
      },
    ],
    allPublications: "查看完整论文记录",
    experienceKicker: "工作与教育经历",
    experienceTitle: "跨越三所高校的科研路径",
    timeline: [
      {
        date: "2025.10 — 至今",
        role: "博士后研究员 · 电气工程系",
        place: "韩国浦项科技大学（POSTECH）",
        detail: "三维全息聚焦、高功率微波、封装天线，以及6G毫米波/太赫兹阵列天线。",
      },
      {
        date: "2025.07 — 2025.10",
        role: "研究助理 · 理工学院",
        place: "香港中文大学（深圳）",
        detail: "介电常数近零几何无关电路与天线，以及非互易微波系统。",
      },
      {
        date: "2020.09 — 2025.06",
        role: "博士 · 电子科学与技术",
        place: "北京交通大学",
        detail: "漏波天线、可重构与宽带天线、超材料技术；导师：王均宏教授。",
      },
      {
        date: "2019.09 — 2020.08",
        role: "硕士 · 电子科学与技术",
        place: "北京交通大学",
        detail: "开展天线理论与电磁工程方向研究。",
      },
    ],
    honorsKicker: "荣誉与学术服务",
    honorsTitle: "学术服务、奖学金与科研项目",
    awardsTitle: "奖学金",
    awards: [
      "国家留学基金委奖学金",
    ],
    serviceTitle: "学术服务",
    service:
      "担任IEEE TAP、IEEE Antennas and Propagation Magazine、IEEE AWPL、IEEE OJAP、IEEE TCPMT、Electronics Letters及IET Microwaves, Antennas & Propagation等7本期刊及多项国际会议审稿人。",
    projectsTitle: "科研项目",
    projects:
      "参与国家自然科学基金重点项目和国家重点研发计划，涉及复杂空间电波覆盖、通感传多频段一体化天线、可变形电磁蒙皮、散射缩减与波束赋形等方向。",
    contactKicker: "联系方式",
    contactTitle: "一起探索下一束电磁波。",
    contactBody: "欢迎围绕天线、电磁、6G硬件、联合研究与学术合作进行交流。",
    emailLabel: "邮箱",
    locationLabel: "所在地",
    location: "韩国浦项科技大学 · 浦项",
    footer: "郑伟 · 天线、电磁与6G · 中英双语学术主页",
  },
} as const;

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const content = copy[language];

  useEffect(() => {
    const saved = window.localStorage.getItem("wei-zheng-language");
    if (saved === "en" || saved === "zh") {
      setLanguage(saved);
      document.documentElement.lang = saved === "zh" ? "zh-CN" : "en";
    }
  }, []);

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setMenuOpen(false);
    document.documentElement.lang = nextLanguage === "zh" ? "zh-CN" : "en";
    window.localStorage.setItem("wei-zheng-language", nextLanguage);
  };

  return (
    <div className={`site-shell language-${language}`}>
      <a className="skip-link" href="#main-content">
        {content.skip}
      </a>

      <header className="site-header">
        <a className="brand" href="#top" aria-label={content.brand}>
          <span className="brand-mark">WZ</span>
          <span className="brand-name">{content.brand}</span>
        </a>

        <button
          className="menu-button"
          type="button"
          aria-label={menuOpen ? content.menuClose : content.menuOpen}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={24} /> : <List size={24} />}
        </button>

        <div className={`header-panel ${menuOpen ? "is-open" : ""}`}>
          <nav id="primary-navigation" aria-label="Primary navigation">
            {content.nav.map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
          </nav>

          <div className="language-toggle" aria-label="Language selection">
            <button
              type="button"
              onClick={() => changeLanguage("en")}
              aria-pressed={language === "en"}
            >
              EN
            </button>
            <span aria-hidden="true">/</span>
            <button
              type="button"
              onClick={() => changeLanguage("zh")}
              aria-pressed={language === "zh"}
            >
              中文
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">
              {content.heroTitle}
              <span>{language === "en" ? "郑伟" : "Wei Zheng"}</span>
            </h1>
            <p className="eyebrow">{content.heroEyebrow}</p>
            <p className="hero-description">{content.heroDescription}</p>

            <div className="hero-actions">
              <a className="button button-primary" href="#research">
                {content.primaryCta}
                <ArrowRight size={19} weight="bold" aria-hidden="true" />
              </a>
              <a
                className="button button-secondary"
                href={scholarUrl}
                target="_blank"
                rel="noreferrer"
              >
                {content.scholarCta}
                <ArrowSquareOut size={19} aria-hidden="true" />
              </a>
            </div>

            <dl className="stat-grid">
              {content.stats.map(([value, label]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="data-note">{content.dataNote}</p>
          </div>

          <figure className="hero-visual">
            <img
              className="hero-composite"
              src="/assets/hero-reference-composite.jpg"
              alt={content.visualAlt}
            />
          </figure>

          <div className="focus-strip" aria-labelledby="focus-title">
            <img
              className="focus-panorama"
              src="/assets/electromagnetic-concept-panorama.png"
              alt=""
              aria-hidden="true"
            />
            <div className="section-rule">
              <span id="focus-title">{content.focusLabel}</span>
            </div>
            <div className="focus-grid">
              {content.research.map((item) => (
                <a href="#research" className="focus-item" key={item.number}>
                  <span className="focus-number">{item.number}</span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>
                  <ArrowRight size={18} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="content-section about-section" id="about">
          <div className="section-heading">
            <p>{content.aboutKicker}</p>
            <h2>{content.aboutTitle}</h2>
          </div>
          <div className="about-layout">
            <div className="about-copy">
              {content.aboutBody.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <dl className="fact-list">
              {content.aboutFacts.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="content-section research-section" id="research">
          <div className="section-heading heading-split">
            <div>
              <p>{content.researchKicker}</p>
              <h2>{content.researchTitle}</h2>
            </div>
            <p className="section-intro">{content.researchIntro}</p>
          </div>

          <div className="research-grid">
            {content.research.map((item) => (
              <article className="research-card" key={item.number}>
                <div className="research-card-copy">
                  <span>{item.number}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section publications-section" id="publications">
          <div className="section-heading heading-split">
            <div>
              <p>{content.publicationsKicker}</p>
              <h2>{content.publicationsTitle}</h2>
            </div>
            <p className="section-intro">{content.publicationsIntro}</p>
          </div>

          <div className="publication-list">
            {content.papers.map((paper, index) => (
              <article className="publication-row" key={paper.doi}>
                <span className="publication-index">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p className="publication-meta">{paper.year} · {paper.note}</p>
                  <h3>
                    <a href={paper.doi} target="_blank" rel="noreferrer">
                      {paper.title}
                      <ArrowSquareOut size={17} aria-hidden="true" />
                    </a>
                  </h3>
                  <p>{paper.venue}</p>
                </div>
              </article>
            ))}
          </div>
          <a className="text-link" href={scholarUrl} target="_blank" rel="noreferrer">
            {content.allPublications}
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </section>

        <section className="content-section experience-section" id="experience">
          <div className="section-heading">
            <p>{content.experienceKicker}</p>
            <h2>{content.experienceTitle}</h2>
          </div>
          <div className="timeline">
            {content.timeline.map((item) => (
              <article key={`${item.date}-${item.place}`}>
                <time>{item.date}</time>
                <div>
                  <h3>{item.role}</h3>
                  <p className="timeline-place">{item.place}</p>
                  <p>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section honors-section" id="honors">
          <div className="section-heading">
            <p>{content.honorsKicker}</p>
            <h2>{content.honorsTitle}</h2>
          </div>
          <div className="honors-grid">
            <div>
              <h3>{content.awardsTitle}</h3>
              <ol className="award-list">
                {content.awards.map((award, index) => (
                  <li key={award}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {award}
                  </li>
                ))}
              </ol>
            </div>
            <div className="service-stack">
              <article>
                <GraduationCap size={28} aria-hidden="true" />
                <h3>{content.serviceTitle}</h3>
                <p>{content.service}</p>
              </article>
              <article>
                <Atom size={28} aria-hidden="true" />
                <h3>{content.projectsTitle}</h3>
                <p>{content.projects}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div>
            <p className="contact-kicker">{content.contactKicker}</p>
            <h2>{content.contactTitle}</h2>
            <p>{content.contactBody}</p>
          </div>
          <div className="contact-links">
            <a href="mailto:zhengwei@postech.ac.kr">
              <EnvelopeSimple size={24} aria-hidden="true" />
              <span>
                <small>{content.emailLabel}</small>
                zhengwei@postech.ac.kr
              </span>
            </a>
            <div>
              <MapPin size={24} aria-hidden="true" />
              <span>
                <small>{content.locationLabel}</small>
                {content.location}
              </span>
            </div>
            <a href={scholarUrl} target="_blank" rel="noreferrer">
              <GraduationCap size={24} aria-hidden="true" />
              <span>
                <small>Profile</small>
                Google Scholar
              </span>
            </a>
          </div>
        </section>
      </main>

      <footer>
        <p>{content.footer}</p>
        <p>© 2026 Wei Zheng</p>
      </footer>
    </div>
  );
}
