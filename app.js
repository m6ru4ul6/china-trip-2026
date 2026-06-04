const cityClassMap = {
  杭州: "hangzhou",
  烏鎮: "wuzhen",
  上海: "shanghai",
};

const typeLabels = {
  transport: "交通",
  hotel: "住宿",
  food: "餐飲",
  culture: "文化",
  shopping: "街區",
  nature: "自然",
  nightview: "夜景",
  museum: "博物館",
  viewpoint: "觀景",
  optional: "可選",
  flight: "航班",
};

const hotelCityLabels = {
  all: "全部",
  hangzhou: "杭州",
  wuzhen: "烏鎮",
  shanghai: "上海",
};

const categoryLabels = {
  flight: "航班",
  reservation: "預約",
  hotel: "住宿",
  transport: "交通",
  document: "證件",
  site: "網站",
};

const stayNameByCity = {
  杭州: "Pagoda君亭設計飯店",
  烏鎮: "烏鎮民宿",
  上海: "上海中心J飯店",
  回台: "回台",
};

let activeDayIndex = 0;
let activeHotelFilter = "all";
let activeFoodFilter = "all";
let activePlaceFilter = "all";
let checklistState = loadChecklistState();

function $(selector) {
  return document.querySelector(selector);
}

function createElement(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}

function cityTag(city) {
  const span = createElement("span", `tag ${cityClassMap[city] || ""}`, city);
  return span;
}

function plainTag(label, variant = "") {
  return createElement("span", `tag ${variant}`.trim(), label);
}

function formatDate(dateString) {
  const [, month, day] = dateString.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function loadChecklistState() {
  try {
    const stored = localStorage.getItem("chinaTripChecklist");
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

function saveChecklistState() {
  localStorage.setItem("chinaTripChecklist", JSON.stringify(checklistState));
}

function renderDashboard() {
  const doneCount = checklist.filter((item, index) => checklistState[index]).length;
  const cards = [
    {
      label: "旅行日期",
      value: tripMeta.datesLabel,
      description: `${tripMeta.nights}，城市順序：${tripMeta.cities.join("、")}`,
    },
    {
      label: "航班資訊",
      value: "虹橋進出",
      description: "去程 CA198：台北松山 TSA → 上海虹橋 SHA，6/6 17:10 抵達。回程 CA197：上海虹橋 SHA → 台北松山 TSA，6/11 12:15 起飛。",
    },
    {
      label: "每日住宿",
      value: "杭 2・烏 2・滬 1",
      description: "杭州兩晚，烏鎮兩晚，上海中心J飯店一晚。",
    },
    {
      label: "待辦進度",
      value: `${doneCount}/${checklist.length}`,
      description: "可在待辦清單勾選，瀏覽器會自動保留狀態。",
    },
  ];

  const container = $("#dashboardCards");
  container.replaceChildren(
    ...cards.map((card) => {
      const article = createElement("article", "metric-card");
      article.append(
        createElement("div", "label", card.label),
        createElement("div", "value", card.value),
        createElement("p", "description", card.description),
      );
      return article;
    }),
  );
}

function selectDay(index, shouldScroll = false) {
  activeDayIndex = index;
  renderRouteNav();
  renderDayTabs();
  renderItinerary();
  if (shouldScroll) {
    $("#itinerary").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderRouteNav() {
  const container = $("#routeQuickNav");
  container.replaceChildren(
    ...itineraryDays.map((day, index) => {
      const button = createElement("button", `route-button ${index === activeDayIndex ? "active" : ""}`);
      const stayLabel = day.hotelCity === "回台" ? "回台" : `住宿：${stayNameByCity[day.hotelCity] || day.hotelCity}`;
      button.type = "button";
      button.setAttribute("aria-pressed", String(index === activeDayIndex));
      button.append(
        createElement("span", "route-day", `Day ${index + 1}・${formatDate(day.date)}`),
        createElement("span", "route-stay", stayLabel),
      );
      button.addEventListener("click", () => selectDay(index, true));
      return button;
    }),
  );
}

function renderDayTabs() {
  const container = $("#dayTabs");
  container.replaceChildren(
    ...itineraryDays.map((day, index) => {
      const button = createElement("button", `tab-button ${index === activeDayIndex ? "active" : ""}`);
      button.type = "button";
      button.textContent = `Day ${index + 1}・${formatDate(day.date)}`;
      button.setAttribute("aria-pressed", String(index === activeDayIndex));
      button.addEventListener("click", () => selectDay(index));
      return button;
    }),
  );
}

function renderItinerary() {
  const day = itineraryDays[activeDayIndex];
  const summary = createElement("aside", "day-summary");
  summary.append(
    createElement("div", "date", `${formatDate(day.date)} ${day.day}`),
    createElement("h3", "", day.title),
  );
  if (day.note) summary.append(createElement("p", "", day.note));

  const facts = createElement("div", "day-facts");
  [
    ["城市", day.city],
    ["住宿", stayNameByCity[day.hotelCity] || day.hotelCity || "回台"],
    ["今日重點", day.focus],
  ].forEach(([label, value]) => {
    const fact = createElement("div", "day-fact");
    fact.append(createElement("strong", "", label), document.createTextNode(value));
    facts.append(fact);
  });
  summary.append(facts);

  const timeline = createElement("div", "timeline");
  day.events.forEach((event) => {
    const item = createElement("article", "timeline-item");
    item.dataset.type = event.type;

    const top = createElement("div", "timeline-top");
    const left = createElement("div");
    left.append(createElement("div", "timeline-time", event.time), createElement("div", "timeline-title", event.title));

    const badges = createElement("div", "badges");
    badges.append(plainTag(typeLabels[event.type] || event.type));
    badges.append(plainTag(event.required ? "必排" : "可選", event.required ? "gold" : "coral"));
    if (event.reservation) badges.append(plainTag("需預約", "coral"));
    if (event.weatherDependent) badges.append(plainTag("看天氣", "wuzhen"));

    top.append(left, badges);
    item.append(top, createElement("p", "", event.detail));
    timeline.append(item);
  });

  $("#itineraryBoard").replaceChildren(summary, timeline);
}

function renderFlights() {
  const container = $("#flightList");
  container.replaceChildren(
    ...flights.map((flight) => {
      const row = createElement("div", "info-row");
      const time = flight.arrivalTime || flight.departureTime;
      row.append(
        createElement("strong", "", `${formatDate(flight.date)} ${flight.label}・${flight.direction}`),
        createElement("span", "", `${flight.flightNo}｜時間：${time}｜狀態：${flight.status}`),
        createElement("span", "", `${flight.departAirport} → ${flight.arriveAirport}`),
        createElement("span", "", flight.note),
      );
      return row;
    }),
  );
}

function renderTransfers() {
  const container = $("#transferList");
  container.replaceChildren(
    ...transfers.map((transfer) => {
      const row = createElement("div", "info-row");
      row.append(
        createElement("strong", "", transfer.title),
        createElement("span", "", transfer.time),
        createElement("span", "", transfer.note),
      );
      return row;
    }),
  );
}

function renderHotelFilters() {
  const container = $("#hotelFilters");
  container.replaceChildren(
    ...Object.entries(hotelCityLabels).map(([key, label]) => {
      const button = createElement("button", `segment-button ${key === activeHotelFilter ? "active" : ""}`, label);
      button.type = "button";
      button.setAttribute("aria-pressed", String(key === activeHotelFilter));
      button.addEventListener("click", () => {
        activeHotelFilter = key;
        renderHotelFilters();
        renderHotels();
      });
      return button;
    }),
  );
}

function renderHotels() {
  const entries = Object.entries(hotelCandidates)
    .filter(([cityKey]) => activeHotelFilter === "all" || activeHotelFilter === cityKey)
    .flatMap(([cityKey, hotels]) => hotels.map((hotel) => ({ ...hotel, cityKey })));

  const container = $("#hotelGrid");
  container.replaceChildren(
    ...entries.map((hotel) => {
      const article = createElement("article", "hotel-card");
      const tags = createElement("div", "tag-row");
      tags.append(plainTag(hotelCityLabels[hotel.cityKey], cityClassMap[hotelCityLabels[hotel.cityKey]]), plainTag(priorityLabel(hotel.priority), "gold"));

      const stats = createElement("div", "hotel-meta");
      [
        ["入住", hotel.stayDates || "待補"],
        ["區域", hotel.area || "待補"],
        ["位置", hotel.landmark || "待補"],
      ].forEach(([label, value]) => {
        const stat = createElement("div", "hotel-stat");
        stat.append(createElement("strong", "", value), createElement("span", "", label));
        stats.append(stat);
      });

      const link = hotel.link
        ? createElement("a", "hotel-link", "查看飯店連結")
        : createElement("span", "hotel-link muted", "飯店連結待補");
      if (hotel.link) {
        link.href = hotel.link;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }

      article.append(
        tags,
        createElement("h3", "", hotel.name),
        createElement("p", "", hotel.area),
        stats,
        link,
        createElement("p", "", hotel.note),
      );
      return article;
    }),
  );
}

function priorityLabel(priority) {
  return {
    confirmed: "已確定",
    highest: "首選",
    high: "推薦",
    medium: "備選",
  }[priority] || "候選";
}

function foodStatusTag(status) {
  if (status === "已定案") return plainTag(status, "gold");
  if (status === "備選") return plainTag(status, "coral");
  return plainTag(status, "wuzhen");
}

function renderFoodFilters() {
  const filters = ["all", "杭州", "烏鎮", "上海", "已定案", "彈性", "備選"];
  const container = $("#foodFilters");
  container.replaceChildren(
    ...filters.map((filter) => {
      const label = filter === "all" ? "全部" : filter;
      const button = createElement("button", `segment-button ${filter === activeFoodFilter ? "active" : ""}`, label);
      button.type = "button";
      button.setAttribute("aria-pressed", String(filter === activeFoodFilter));
      button.addEventListener("click", () => {
        activeFoodFilter = filter;
        renderFoodFilters();
        renderFood();
      });
      return button;
    }),
  );
}

function renderFood() {
  const filtered = foodCandidates.filter(
    (food) =>
      activeFoodFilter === "all" ||
      food.city === activeFoodFilter ||
      food.status === activeFoodFilter,
  );
  const container = $("#foodGrid");
  container.replaceChildren(
    ...filtered.map((food) => {
      const article = createElement("article", "food-card");
      if (food.image) {
        const image = document.createElement("img");
        image.src = food.image;
        image.alt = `${food.name} ${food.imageType || "代表圖片"}`;
        image.loading = "lazy";
        article.append(image);
      }

      const content = createElement("div", "food-content");
      const tags = createElement("div", "tag-row");
      tags.append(cityTag(food.city), foodStatusTag(food.status));

      const details = createElement("div", "food-details");
      [
        ["餐別", food.meal],
        ["建議", food.day],
        ["特色", food.specialties],
      ].forEach(([label, value]) => {
        const row = createElement("div");
        row.append(createElement("strong", "", `${label}：`), document.createTextNode(value));
        details.append(row);
      });

      content.append(
        tags,
        createElement("h3", "", food.name),
        createElement("p", "", food.reason),
        details,
      );
      if (food.groups) {
        const groups = createElement("div", "food-groups");
        food.groups.forEach((group) => {
          const groupCard = createElement("div", "food-group");
          const list = document.createElement("ul");
          group.items.forEach((item) => {
            const li = document.createElement("li");
            li.textContent = item;
            list.append(li);
          });
          groupCard.append(createElement("strong", "", group.title), list);
          groups.append(groupCard);
        });
        content.append(groups);
      }
      if (food.imageSource) {
        const credit = createElement("a", "food-credit", `圖片：${food.imageSource.label}`);
        credit.href = food.imageSource.url;
        credit.target = "_blank";
        credit.rel = "noopener noreferrer";
        content.append(credit);
      }
      article.append(content);
      return article;
    }),
  );
}

function renderPlaceFilters() {
  const filters = ["all", "杭州", "烏鎮", "上海", "必排", "可選"];
  const container = $("#placeFilters");
  container.replaceChildren(
    ...filters.map((filter) => {
      const label = filter === "all" ? "全部" : filter;
      const button = createElement("button", `segment-button ${filter === activePlaceFilter ? "active" : ""}`, label);
      button.type = "button";
      button.setAttribute("aria-pressed", String(filter === activePlaceFilter));
      button.addEventListener("click", () => {
        activePlaceFilter = filter;
        renderPlaceFilters();
        renderPlaces();
      });
      return button;
    }),
  );
}

function renderPlaces() {
  const filtered = places.filter(
    (place) =>
      activePlaceFilter === "all" ||
      place.city === activePlaceFilter ||
      place.priority === activePlaceFilter,
  );
  const container = $("#placeGrid");
  container.replaceChildren(
    ...filtered.map((place) => {
      const article = createElement("article", "place-card");
      const image = document.createElement("img");
      image.src = place.image;
      image.alt = place.name;
      image.loading = "lazy";

      const content = createElement("div", "content");
      const tags = createElement("div", "tag-row");
      tags.append(cityTag(place.city), plainTag(place.priority, place.priority === "必排" ? "gold" : "coral"));

      const details = createElement("div", "details");
      [
        ["建議", place.day],
        ["類型", place.type],
        ["時間", place.hours],
        ["提醒", place.reminder],
      ].forEach(([label, value]) => {
        const row = createElement("div");
        row.append(createElement("strong", "", `${label}：`), document.createTextNode(value));
        details.append(row);
      });

      content.append(tags, createElement("h3", "", place.name), createElement("p", "", place.description), details);
      if (place.guide) {
        const guideLink = createElement("a", "place-link", `閱讀：${place.guide.title}`);
        guideLink.href = place.guide.url;
        guideLink.target = "_blank";
        guideLink.rel = "noopener noreferrer";
        guideLink.setAttribute("aria-label", `閱讀 ${place.name} 的中文遊記或介紹`);
        content.append(guideLink);
      }
      article.append(image, content);
      return article;
    }),
  );
}

function renderChecklist() {
  const doneCount = checklist.filter((item, index) => checklistState[index]).length;
  const progress = Math.round((doneCount / checklist.length) * 100);

  const summary = $("#checklistSummary");
  const progressRing = createElement("div", "progress-ring", `${progress}%`);
  progressRing.style.setProperty("--progress", `${progress}%`);
  summary.replaceChildren(
    progressRing,
    createElement("h3", "", `已完成 ${doneCount} / ${checklist.length}`),
    createElement("p", "", "勾選後會自動儲存在這台裝置的瀏覽器，下次打開仍會保留。"),
  );

  const list = $("#checklistList");
  list.replaceChildren(
    ...checklist.map((item, index) => {
      const done = Boolean(checklistState[index]);
      const label = createElement("label", `check-item ${done ? "done" : ""}`);
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = done;
      input.addEventListener("change", () => {
        checklistState[index] = input.checked;
        saveChecklistState();
        renderDashboard();
        renderChecklist();
      });

      label.append(
        input,
        createElement("span", "check-title", item.item),
        createElement("span", "check-category", categoryLabels[item.category] || item.category),
      );
      return label;
    }),
  );
}

function renderPreparation() {
  const grid = $("#preDepartureGrid");
  if (!grid) return;

  grid.replaceChildren(
    ...preDeparturePrep.map((section) => {
      const card = createElement("article", "prep-card");
      const list = document.createElement("ul");
      section.items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.append(li);
      });

      card.append(
        createElement("span", "prep-label", section.highlight),
        createElement("h3", "", section.title),
        list,
      );
      return card;
    }),
  );

  const sources = $("#preDepartureSources");
  if (!sources) return;
  sources.replaceChildren(document.createTextNode("參考："));
  preDepartureSources.forEach((source, index) => {
    const link = createElement("a", "", source.label);
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    sources.append(link);
    if (index < preDepartureSources.length - 1) {
      sources.append(document.createTextNode("、"));
    }
  });
}

function bindResetChecklist() {
  $("#resetChecklist").addEventListener("click", () => {
    checklistState = {};
    saveChecklistState();
    renderDashboard();
    renderChecklist();
  });
}

function init() {
  $(".hero").style.backgroundImage = `url("${images.hero}")`;
  renderDashboard();
  renderRouteNav();
  renderDayTabs();
  renderItinerary();
  renderFlights();
  renderTransfers();
  renderHotelFilters();
  renderHotels();
  renderFoodFilters();
  renderFood();
  renderPlaceFilters();
  renderPlaces();
  renderChecklist();
  renderPreparation();
  bindResetChecklist();
}

init();
