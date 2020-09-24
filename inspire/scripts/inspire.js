const LOINC_VOLUME_EXP = "20140-0";
const LOINC_PRESSURE = "76164-3";
const LOINC_FLOW = "60791-1";
const LOINC_PLATEAU = "76259-1";
const LOINC_PEEP = "76248-4";
const LOINC_BREATH_RATE = "9279-1";
const LOINC_SETTING_PRESSURE = "20062-6";
const LOINC_SETTING_PEEP = "20077-4";
const LOINC_SETTING_BREATH_RATE = "19834-1";

//                      Variables
var wsUri = "ws://test.fhir.org/r4/websockets"; //server URL
var subscriptionID = 6; //subscription ID on fhir server
var colorNames = Object.keys(window.chartColors);

/*
                        Window events
*/

window.onload = function () {
  //graph initialization

  var ctx = document.getElementById("fluxo").getContext("2d");
  window.myLine = [new Chart(ctx, config[0])];
  ctx = document.getElementById("volume").getContext("2d");
  window.myLine.push(new Chart(ctx, config[1]));
  ctx = document.getElementById("pressao").getContext("2d");
  window.myLine.push(new Chart(ctx, config[2]));
};

window.onbeforeunload = function () {
  // websocket.onclose = function () {}; // disable onclose handler first
  websocket.close();
};

/*
                        Buttons click events
*/

$(document).ready(function () {
  //clear graphs
  let i = 0;
  $("#removeData").click(function () {
    for (i = 0; i < config.length; i++) {
      config[i].data.labels = []; // remove the label first
      config[i].data.datasets[0].data = [];
      window.myLine[i].update();
    }
  });
  //disconnect from server
  $("#btnDisconnect").click(function () {
    //disconnect from server
    websocket.close();
  });
  //connect to server
  $("#btnConnect").click(function () {
    //disconnect from server
    createWebsocket();
  });
});

/* 
                        Fhir parsing
*/
function processFhirMessage(fhirObj) {
  var code = fhirObj.code.coding[0].code;
  switch (code) {
    case LOINC_VOLUME_EXP:
      addNewData(fhirObj.valueSampledData.data, 1);
      break;
    case LOINC_PRESSURE:
      addNewData(fhirObj.valueSampledData.data, 2);
      break;
    case LOINC_FLOW:
      addNewData(fhirObj.valueSampledData.data, 0);
      break;
    default:
      $(code).text("data");
      break;
  }
}

function addNewData(dataSeries, graphTarget) {
  var dataArray = dataSeries.split(" ");
  var i;

  for (i = 0; i < dataArray.length; i++) {
    if (config[graphTarget].data.datasets.length > 0) {
      var xLabel = config[graphTarget].data.labels.length;
      config[graphTarget].data.labels.push(xLabel);

      config[graphTarget].data.datasets[0].data.push(parseFloat(dataArray[i]));

      window.myLine[graphTarget].update();
    }
  }
}

/*
                        Websocket functions
*/

function createWebsocket() {
  websocket = new WebSocket(wsUri);
  websocket.onopen = function (evt) {
    onOpen(evt);
  };
  websocket.onclose = function (evt) {
    onClose(evt);
  };
  websocket.onmessage = function (evt) {
    onMessage(evt);
  };
  websocket.onerror = function (evt) {
    onError(evt);
  };
}

function onOpen(evt) {
  console.log("CONNECTED");
  let temp = $("#subscriptionID").val();
  if (temp > 2) {
    subscriptionID = temp;
  }
  doSend("bind " + subscriptionID);
}

function onClose(evt) {
  $("#connectionStatus").text("Desconectado");
  $("#connectionStatus").css("color", "brown");
}

function onMessage(evt) {
  console.log(evt.data);

  //handle message parsing
  try {
    var obj = JSON.parse(evt.data);
    processFhirMessage(obj);
  } catch {
    if (evt.data == "bound " + subscriptionID) {
      $("#connectionStatus").text("Conectado");
      $("#connectionStatus").css("color", "darkgreen");
    } else {
      $("#connectionStatus").text("Desconectado");
      $("#connectionStatus").css("color", "brown");
    }
  }
}

function onError(evt) {
  console.log('<span style="color: red;">ERROR:</span> ' + evt.data);
}

function doSend(message) {
  console.log("SENT: " + message);
  websocket.send(message);
}

/*
                        Graph configuration
*/
var config = [
  {
    type: "line",
    data: {
      labels: [0],
      datasets: [
        {
          label: "Fluxo",
          backgroundColor: window.chartColors.red,
          borderColor: window.chartColors.red,
          data: [0],
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      title: {
        display: false,
        text: "Medida de fluxo",
      },
      tooltips: {
        mode: "index",
        intersect: false,
      },
      hover: {
        mode: "nearest",
        intersect: true,
      },
      scales: {
        xAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              labelString: "time",
            },
          },
        ],
        yAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              labelString: "Value",
            },
          },
        ],
      },
    },
  },
  {
    type: "line",
    data: {
      labels: [0],
      datasets: [
        {
          label: "Volume",
          backgroundColor: window.chartColors.blue,
          borderColor: window.chartColors.blue,
          data: [0],
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      title: {
        display: false,
        text: "Medida de volume",
      },
      tooltips: {
        mode: "index",
        intersect: false,
      },
      hover: {
        mode: "nearest",
        intersect: true,
      },
      scales: {
        xAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              labelString: "time",
            },
          },
        ],
        yAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              labelString: "Value",
            },
          },
        ],
      },
    },
  },
  {
    type: "line",
    data: {
      labels: [0],
      datasets: [
        {
          label: "Pressão",
          backgroundColor: window.chartColors.green,
          borderColor: window.chartColors.green,
          data: [0],
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      title: {
        display: false,
        text: "Medida de Pressão",
      },
      tooltips: {
        mode: "index",
        intersect: false,
      },
      hover: {
        mode: "nearest",
        intersect: true,
      },
      scales: {
        xAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              labelString: "time",
            },
          },
        ],
        yAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              labelString: "Value",
            },
          },
        ],
      },
    },
  },
];
