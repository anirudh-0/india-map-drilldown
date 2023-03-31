import React, { useState, useEffect, useCallback } from "react";
import Highcharts from "highcharts/highmaps";
import HighchartsReact from "highcharts-react-official";
import drilldown from "highcharts/modules/drilldown";
import dataModule from "highcharts/modules/data";

drilldown(Highcharts);
dataModule(Highcharts);

const options = {
  title: {
    text: "",
  },

  chart: {
    events: {},
  },

  legend: {
    layout: "vertical",
    align: "right",
    verticalAlign: "middle",
  },

  colorAxis: {
    min: 0,
    minColor: "#E6E7E8",
    maxColor: "#005645",
  },

  mapNavigation: {
    enabled: true,
    buttonOptions: {
      verticalAlign: "bottom",
    },
  },

  plotOptions: {
    map: {
      states: {
        hover: {
          color: "#EEDD66",
        },
      },
    },
  },

  series: [],

  drilldown: {
    activeDataLabelStyle: {
      color: "#FFFFFF",
      textDecoration: "none",
      textOutline: "1px #000000",
    },
    drillUpButton: {
      relativeTo: "spacingBox",
      position: {
        x: 0,
        y: 60,
      },
    },
  },
};

const reactChartOptions = {
  ...options,
  chart: {},
  series: [],
};

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function randomIntInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class App2 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      options: {
        ...reactChartOptions,
        title: { text: props.title || "Temporary Title" },
      },
      mapLoaded: false,
      mapKeys: [],
    };
  }

  static getDerivedStateFromProps(props, state) {
    return {
      options: {
        ...state.options,
        title: { text: props.title || "Temporary Title" },
      },
    };
  }

  componentDidMount() {
    this.loadMap(["india"]);
  }

  getToolTipPointFormat = () => {
    return `<div style="display: block;">
    <div style="display: block; color: red;">Daily: {point.stats.dailyProductionRate}</div><br />
    <div style="display: block;">Weekly: {point.stats.weeklyProductionRate}</div><br />
    <div style="display: block;">Monthly: {point.stats.monthlyProductionRate}</div>
    </div>`;
  };

  fetchRegionalStats = async (mapKeys) => {
    return fetch(`/sample-${mapKeys.join("-")}.json`, {
      // method: "POST",
      // body: JSON.stringify({
      //   state: this.state.mapKeys[1] || null, // if state then district-wise per state, if state is null, then state-wise of India
      // }),
    }).then((res) => res.json());
  };

  fetchMapData = async (mapKeys) => {
    return Promise.all([
      fetch(`/${mapKeys.join("/")}.geojson`).then((res) => res.json()),
      this.fetchRegionalStats(mapKeys),
      fetch(`/sample-${mapKeys.join("-")}.json`).then((res) => res.json()),
      // FIXME: also return stats data
    ]).then(([mapData, stats]) => ({ mapData, stats }));
  };

  loadMap = async (mapKeys) => {
    const { mapData, stats } = await this.fetchMapData(mapKeys);

    const map = Highcharts.geojson(mapData);
    const separators = Highcharts.geojson(mapData, "mapline");
    // Set drilldown pointers
    map.forEach(function (el, i) {
      el.drilldown = ["states", el.properties.STATE];
      const stateStatistics = stats[el.properties.STATE] || {};
      el.stats = {
        dailyProductionRate: stateStatistics.dailyProductionRate || "N/A",
        weeklyProductionRate: stateStatistics.weeklyProductionRate || "N/A",
        monthlyProductionRate: stateStatistics.monthlyProductionRate || "N/A",
      };
      el.name = toTitleCase(el.properties.STATE);
      el.value =
        stateStatistics.weeklyProductionRate || randomIntInRange(0, 60);
    });
    const fetchMapData = this.fetchMapData;
    const getToolTipPointFormat = this.getToolTipPointFormat;
    this.setState(({ options }) => {
      return {
        mapLoaded: true,
        mapKeys: mapKeys,
        options: {
          ...options,
          chart: {
            events: {
              drilldown: function (e) {
                const chart = this;
                if (!e.point.drilldown) {
                  return;
                }
                // chart.showLoading(
                //   '<i class="icon-spinner icon-spin icon-3x"></i>'
                // );
                chart.showLoading("<div>Loading...</div>");
                fetchMapData(e.point.drilldown)
                  .then(({ mapData, stats }) => ({
                    map: Highcharts.geojson(mapData),
                    stats,
                  }))
                  .then(({ map, stats }) => {
                    // alter data to have name and value
                    const data = map;
                    data.forEach(function (el, i) {
                      const districtStatistics =
                        stats[el.properties.District] || {};
                      el.stats = {
                        dailyProductionRate:
                          districtStatistics.dailyProductionRate || "N/A",
                        weeklyProductionRate:
                          districtStatistics.weeklyProductionRate || "N/A",
                        monthlyProductionRate:
                          districtStatistics.monthlyProductionRate || "N/A",
                      };
                      el.name = toTitleCase(el.properties.District);
                      el.value =
                        districtStatistics.weeklyProductionRate ||
                        randomIntInRange(0, 5);
                    });
                    chart.hideLoading();
                    chart.addSeriesAsDrilldown(e.point, {
                      name: e.point.name,
                      data: data,
                      dataLabels: {
                        enabled: true,
                        format:
                          "{point.properties.District}: {point.stats.weeklyProductionRate}",
                      },
                      tooltip: {
                        pointFormat: getToolTipPointFormat(),
                      },
                    });
                  });
                chart.setTitle(null, { text: e.point.name });
              },
              drillup: function (e) {
                this.setTitle(null, { text: "" });
              },
            },
          },
          series: [
            {
              data: map,
              name: toTitleCase(mapKeys.join("/")),
              dataLabels: {
                enabled: true,
                format:
                  "{point.properties.code}: {point.stats.weeklyProductionRate}",
              },
              tooltip: {
                pointFormat: this.getToolTipPointFormat(),
              },
            },
            {
              type: "mapline",
              data: separators,
              color: "silver",
              enableMouseTracking: false,
              animation: {
                duration: 500,
              },
            },
          ],
        },
      };
    });
  };

  render() {
    if (!this.state.mapLoaded) {
      return <div>Loading...</div>;
    }
    return (
      <div>
        <h2>Highcharts</h2>
        <HighchartsReact
          highcharts={Highcharts}
          options={this.state.options}
          constructorType={"mapChart"}
        />
      </div>
    );
  }
}

export default App2;
