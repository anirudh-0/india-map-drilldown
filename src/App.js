import React, { useState, useEffect, useCallback } from "react";
import Highcharts from "highcharts/highmaps";
import HighchartsReact from "highcharts-react-official";
import drilldow from "highcharts/modules/drilldown";
import dataModule from "highcharts/modules/data";

drilldow(Highcharts);
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

  series: [
    // {
    //   data: data,
    //   name: "USA",
    //   dataLabels: {
    //     enabled: true,
    //     format: "{point.properties.postal-code}",
    //   },
    // },
    // {
    //   type: "mapline",
    //   data: separators,
    //   color: "silver",
    //   enableMouseTracking: false,
    //   animation: {
    //     duration: 500,
    //   },
    // },
  ],

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

// function App() {
//   const [options, setOptions] = useState(reactChartOptions);
//   const loadMap = useCallback(async (mapKey) => {
//     fetch(`/${mapKey}.geojson`)
//       .then((res) => res.json())
//       .then((data) => {
//         const map = Highcharts.geojson(data);
//         const separators = Highcharts.geojson(data, "mapline");
//         // Set drilldown pointers
//         map.forEach(function (el, i) {
//           el.drilldown = el.properties["hc-key"];
//           el.value = i; // Non-random bogus data
//         });
//         setOptions((options) => {
//           return {
//             ...options,
//             series: [
//               {
//                 data: map,
//                 name: mapKey,
//                 dataLabels: {
//                   enabled: true,
//                   format: "{point.properties.postal-code}",
//                 },
//               },
//               {
//                 type: "mapline",
//                 data: separators,
//                 color: "silver",
//                 enableMouseTracking: false,
//                 animation: {
//                   duration: 500,
//                 },
//               },
//             ],
//           };
//         });
//       });
//   }, []);

//   useEffect(() => {
//     loadMap("india");
//   }, []);
// //   return "Hi";

//   return (
//     <div>
//       <h2>Highcharts</h2>
//       <HighchartsReact
//         highcharts={Highcharts}
//         options={options}
//         constructorType={"mapChart"}
//       />
//     </div>
//   );
// }

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      options: reactChartOptions,
      mapLoaded: false,
    };
  }
  componentDidMount() {
    this.loadMap("india_states");
  }

  loadMap = async (mapKey) => {
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
          el.name = el.properties.STATE;
        });
        this.setState(({ options }) => {
          return {
            mapLoaded: true,
            options: {
              ...options,
              chart: { events: { drilldown: function (e) {} } },
              series: [
                {
                  data: map,
                  name: mapKey,
                  dataLabels: {
                    enabled: true,
                    format: "{point.properties.STATE}",
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

export default App;
