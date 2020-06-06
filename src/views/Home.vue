<template>
  <div>
    <v-container>
      <v-row>
        <v-col cols="12">
          <div class="title">Main Dashboard</div>
          <div class="subtitle-1">Total Payments: 0.008841781 USD</div>
        </v-col>
        <v-col cols="12" md="5">
          <v-card>
            <v-card-title></v-card-title>
            <v-card-text>
              <DoughnutChart
                :options="doughnutChartOpts"
                :chart-data="lineChartData"
                :height="250"
              />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="7">
          <v-card>
            <v-card-title></v-card-title>
            <v-card-text>
              <LineChart :options="lineChartOpts" :chart-data="lineChartData" :height="250" />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4" v-for="i in 9" :key="i">
          <v-card>
            <v-card-title>
              <span>dev.to</span>
              <v-spacer></v-spacer>
              <v-icon>mdi-alpha-d-circle</v-icon>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <p>
                0.004453383 USD
                <br />Last payment: January 20, 2020 3:00 AM
              </p>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text>
                View Summary
                <v-icon right>mdi-arrow-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import LineChart from '../components/LineChart';
import DoughnutChart from '../components/Doughnut';

export default {
  components: {
    LineChart,
    DoughnutChart
  },
  data: () => ({
    lineChartOpts: {
      legend: {
        display: false
      },
      responsive: true,
      maintainAspectRatio: false
    },
    doughnutChartOpts: {
      legend: {
        display: false
      },
      tooltips: {
        callbacks: {
          title: function(tooltipItem, data) {
            return data['labels'][tooltipItem[0]['index']];
          },
          label: function(tooltipItem, data) {
            return data['datasets'][0]['data'][tooltipItem['index']];
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  }),
  computed: {
    lineChartData() {
      return {
        labels: [
          '2020-06-01',
          '2020-06-02',
          '2020-06-03',
          '2020-06-04',
          '2020-06-05'
        ],
        datasets: [
          {
            data: [100, 200, 100, 300, 500],
            borderColor: '#2196f3',
            borderWidth: 1
          }
        ]
      };
    }
  }
};
</script>