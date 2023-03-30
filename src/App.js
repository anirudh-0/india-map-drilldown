import React, { useState, useEffect, useCallback } from "react";
import Highcharts from "highcharts/highmaps";
import HighchartsReact from "highcharts-react-official";
import drilldown from "highcharts/modules/drilldown";
import dataModule from "highcharts/modules/data";

drilldown(Highcharts);
dataModule(Highcharts);

const options = {
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

function App() {
  const [options, setOptions] = useState(reactChartOptions);
  const [mapLoaded, setMapLoaded] = useState(false);
  const loadMap = useCallback(async (mapKey) => {
    fetch(`/${mapKey}.geojson`)
      .then((res) => res.json())
      .then((data) => {
        const map = Highcharts.geojson(data);
        const separators = Highcharts.geojson(data, "mapline");
        // Set drilldown pointers
        map.forEach(function (el, i) {
          if (!el.properties.DISTRICT_L) {
            el.drilldown = el.properties.STATE;
          }
          el.value = i; // Non-random bogus data
          el.name = toTitleCase(el.properties.STATE);
        });
        setMapLoaded(true);
        setOptions((options) => {
          return {
            ...options,
            chart: {
              events: {
                drilldown: function (e) {
                  const chart = this;
                },
              },
            },
            series: [
              {
                data: map,
                name: mapKey,
                dataLabels: {
                  enabled: true,
                  format: "{point.properties.code}",
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
          };
        });
      });
  }, []);

  useEffect(() => {
    loadMap("india");
  }, []);

  if (!mapLoaded) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <h2>Highcharts</h2>
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        constructorType={"mapChart"}
      />
    </div>
  );
}

class App2 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      options: reactChartOptions,
      mapLoaded: false,
      mapKey: null,
    };
  }
  componentDidMount() {
    this.loadMap("india");
  }

  fetchMapData = async (mapKey) => {
    return Promise.all([
      fetch(`/${mapKey}.geojson`).then((res) => res.json()),
      // FIXME: also return stats data
    ]).then(([mapData /*, stats */]) => ({ mapData /*, stats */ }));
  };

  loadMap = async (mapKey) => {
    const { mapData, stats } = await this.fetchMapData(mapKey);

    const map = Highcharts.geojson(mapData);
    const separators = Highcharts.geojson(mapData, "mapline");
    // Set drilldown pointers
    map.forEach(function (el, i) {
      if (!el.properties.DISTRICT_L) {
        el.drilldown = `states/${el.properties.STATE}`;
      }
      el.value = i; // FIXME: merge with stats
      el.name = toTitleCase(el.properties.STATE);
      // el[premixKey] = stats[el.name].count;
    });
    const fetchMapData = this.fetchMapData;
    this.setState(({ options }) => {
      return {
        mapLoaded: true,
        mapKey,
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
                      if (!el.properties.DISTRICT_L) {
                        el.drilldown = `states/${el.properties.STATE}`;
                      }
                      el.value = i; // FIXME: merge with stats
                      el.name = toTitleCase(el.properties.District);
                    });
                    chart.hideLoading();
                    chart.addSeriesAsDrilldown(e.point, {
                      name: e.point.name,
                      data: data,
                      dataLabels: {
                        enabled: true,
                        format: "{point.properties.District}",
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
              name: toTitleCase(mapKey),
              dataLabels: {
                enabled: true,
                format: "{point.properties.code}",
              },
              // tooltip: {
              //   pointFormat: `{point.${premixKey}}`
              // }
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
