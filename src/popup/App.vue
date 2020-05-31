<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title
        >PayTrackr v{{ manifestVal.version || '' }}</v-toolbar-title
      >
      <v-spacer></v-spacer>
      <v-btn
        v-show="!realTimePopup"
        @click="reloadData"
        icon
        :reloadDisabled="reloadDisabled"
      >
        <v-icon>mdi-reload</v-icon>
      </v-btn>
      <v-menu>
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" icon>
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="resetDataDialog = true">
            <v-list-item-title>Clear History</v-list-item-title>
          </v-list-item>
          <v-list-item @click="exportDialog = true">
            <v-list-item-title>Export History</v-list-item-title>
          </v-list-item>
          <v-list-item @click="optionsDialog = true">
            <v-list-item-title>Options</v-list-item-title>
          </v-list-item>
          <v-list-item @click="aboutDialog = true">
            <v-list-item-title>About PayTrackr</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <template v-slot:extension>
        <v-tabs v-model="tab" centered>
          <v-tab v-for="item in items" :key="item">{{ item }}</v-tab>
        </v-tabs>
      </template>
    </v-app-bar>
    <v-content>
      <v-container>
        <div class="text-center" v-if="loading">
          <v-progress-circular
            :size="50"
            color="primary"
            indeterminate
          ></v-progress-circular>
        </div>
        <v-tabs-items v-model="tab" v-else>
          <v-tab-item eager>
            <Dashboard
              ref="dashboard"
              :items="hostnames"
              :showInXRP="showPaymentsInXRP"
              :xrpInUSD="xrpInUSD"
            />
          </v-tab-item>
          <v-tab-item eager>
            <RecentPayments
              :realTimePopup="realTimePopup"
              ref="recentPayments"
            />
          </v-tab-item>
          <v-tab-item eager>
            <Alerts />
          </v-tab-item>
        </v-tabs-items>
      </v-container>
    </v-content>
    <!-- Dialog -->
    <v-dialog v-model="resetDataDialog">
      <v-card>
        <v-card-title>Are you sure?</v-card-title>
        <v-card-text>
          This will reset all payments back to 0 and clear all alerts.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="resetDataDialog = false">Cancel</v-btn>
          <v-btn text @click="resetData">Clear</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Dialog -->
    <v-dialog v-model="aboutDialog">
      <v-card>
        <v-card-title>PayTrackr {{ manifestVal.version }}</v-card-title>
        <v-card-text>
          <p v-text="manifestVal.description"></p>
          <v-list>
            <v-list-item
              @click="
                aboutDialog = false;
                supperDeveloperDialog = true;
              "
            >
              <v-list-item-content>
                <v-list-item-title>Support developer</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item href="https://robsoriano.com" target="_BLANK">
              <v-list-item-content>
                <v-list-item-title>Visit developer website</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item href="mailto:paytrackr@gmail.com" target="_BLANK">
              <v-list-item-content>
                <v-list-item-title>Report an issue</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <!-- <v-list-item
              href="https://chrome.google.com/webstore/detail/paytrackr/jmkofipfojjlklmjpedfiokppaojkoel"
              target="_BLANK"
            >
              <v-list-item-content>
                <v-list-item-title>Rate</v-list-item-title>
              </v-list-item-content>
            </v-list-item>-->
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- Dialog -->
    <v-dialog v-model="supperDeveloperDialog">
      <v-card>
        <v-card-title>Support Developer</v-card-title>
        <v-card-text>
          <p>Thank you for using my extension. I hope you liked it.</p>
          <p>
            By agreeing to support me, payments will be split between the
            Web-Monetized content and me.
          </p>
          <v-checkbox v-model="agreeSupport" label="I agree"></v-checkbox>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- Dialog -->
    <v-dialog v-model="exportDialog">
      <v-card>
        <v-card-title>Export History</v-card-title>
        <v-card-text>
          <v-radio-group v-model="type" :mandatory="true">
            <v-radio label="XLSX" value="xlsx"></v-radio>
            <v-radio label="CSV" value="csv"></v-radio>
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="exportData">Export</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Dialog -->
    <v-dialog v-model="optionsDialog">
      <v-card>
        <v-card-title>Options</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item>
              <v-list-item-action>
                <v-switch v-model="showCounter"></v-switch>
              </v-list-item-action>
              <v-list-item-title>Show total payments counter</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-action>
                <v-switch v-model="showPaymentsInXRP"></v-switch>
              </v-list-item-action>
              <v-list-item-title>Show payments in XRP</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-action>
                <v-switch v-model="$vuetify.theme.dark"></v-switch>
              </v-list-item-action>
              <v-list-item-title>Dark mode</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-action>
                <v-switch v-model="realTimePopup"></v-switch>
              </v-list-item-action>
              <v-list-item-title
                >Real-time Dashboard (CPU heavy)</v-list-item-title
              >
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- Snackbar -->
    <v-snackbar v-model="snackbar">{{ snackbarText }}</v-snackbar>
  </v-app>
</template>

<script>
import { getRecords, setRecords } from '../utils';
import Dashboard from '../components/Dashboard';
import RecentPayments from '../components/RecentPayments';
import Alerts from '../components/Alerts';
import manifest from '../manifest.json';
import XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default {
  components: {
    Dashboard,
    RecentPayments,
    Alerts
  },
  data() {
    return {
      tab: null,
      items: ['dashboard', 'recent payments', 'alerts'],
      loading: false,
      xrpInUSD: 0,
      resetDataDialog: false,
      snackbar: false,
      snackbarText: '',
      aboutDialog: false,
      exportDialog: false,
      type: 'xlsx',
      supperDeveloperDialog: false,
      agreeSupport: false,
      reloadDisabled: false,
      optionsDialog: false,
      showPaymentsInXRP: false,
      hostnames: [],
      showCounter: false,
      realTimePopup: false
    };
  },
  async created() {
    this.loading = true;
    this.$vuetify.theme.dark = true;
    const [options, price, agreeSupport, hostnames] = await Promise.all([
      getRecords('paytrackr_options', {
        showCounter: true,
        format: 'USD',
        theme: 'dark',
        realTimePopup: false
      }),
      getRecords('paytrackr_xrp_in_usd'),
      getRecords('paytrackr_support_developer', false),
      getRecords('paytrackr_hostnames')
    ]);
    if (options.theme !== 'dark') {
      this.$vuetify.theme.dark = false;
    }

    this.showPaymentsInXRP = options.format === 'XRP';
    this.xrpInUSD = price;
    this.agreeSupport = agreeSupport;
    this.hostnames = hostnames;
    this.showCounter = options.showCounter;
    this.realTimePopup = options.realTimePopup;
    setTimeout(() => {
      this.loading = false;
    }, 250);
    this.$browser.storage.onChanged.addListener(this.onChangeListener);
  },
  beforeDestroy() {
    this.$browser.storage.onChanged.removeListener(this.onChangeListener);
  },
  methods: {
    async onChangeListener(changes) {
      if (changes['paytrackr_xrp_in_usd']) {
        this.xrpInUSD = changes['paytrackr_xrp_in_usd'].newValue;
      }

      if (changes['paytrackr_support_developer']) {
        const tabs = await this.$browser.tabs.query({});
        tabs.forEach(tab => {
          if (tab.url.includes('chrome://') || !tab.url) {
            return;
          }

          this.$browser.tabs.sendMessage(tab.id, {
            agreeSupport: changes['paytrackr_support_developer'].newValue
          });
        });
      }

      if (changes['paytrackr_hostnames'] && this.realTimePopup) {
        this.hostnames = changes['paytrackr_hostnames'].newValue;
      }
    },
    async reloadData() {
      this.reloadDisabled = true;
      this.hostnames = await getRecords('paytrackr_hostnames');
      await this.$refs.recentPayments.fetchHistory();
      this.reloadDisabled = false;
    },
    async resetData() {
      this.resetDataDialog = false;
      await Promise.all([
        setRecords('paytrackr_hostnames', []),
        setRecords('paytrackr_history', []),
        setRecords('paytrackr_disabled_sites', {})
      ]);
      this.hostnames = [];
      this.$refs.recentPayments.items = [];
      this.$refs.recentPayments.initialItems = [];
      this.snackbarText = 'Cleared';
      this.snackbar = true;
      this.resetDataDialog = false;
    },
    async exportData() {
      let data = await getRecords('paytrackr_history');
      data = data.map(item => {
        const obj = { ...item };
        delete obj.id;
        obj.date = this.$options.filters.filterDate(obj.date);
        return obj;
      });

      if (this.type === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'PayTrackr History');
        XLSX.writeFile(wb, `paytrackr_${Date.now()}.xlsx`);
      } else {
        const ws = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(ws, { FS: ';' });

        saveAs(
          new Blob([this.s2ab(csv)], { type: 'application/octet-stream' }),
          `paytrackr_${Date.now()}.csv`
        );
      }
      this.exportDialog = false;
      this.type = 'xlsx';
    },
    s2ab(s) {
      var buf = new ArrayBuffer(s.length);
      var view = new Uint8Array(buf);
      for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xff;
      return buf;
    },
    async updateOptions(data) {
      const options = await getRecords('paytrackr_options');
      setRecords('paytrackr_options', {
        ...options,
        ...data
      });
    }
  },
  watch: {
    resetDataDialog(val) {
      if (!val) {
        this.email = null;
        this.amount = 0;
      }
    },
    async agreeSupport(val) {
      setRecords('paytrackr_support_developer', val);
    },
    showPaymentsInXRP(val) {
      this.updateOptions({
        format: val ? 'XRP' : 'USD'
      });
    },
    realTimePopup(val) {
      this.updateOptions({
        realTimePopup: val
      });
    },
    async showCounter(val) {
      this.updateOptions({
        showCounter: val
      });
      const tabs = await this.$browser.tabs.query({});
      tabs.forEach(tab => {
        if (tab.url.includes('chrome://')) return;
        this.$browser.tabs.sendMessage(tab.id, {
          showCounter: val,
          theme: this.$vuetify.theme.dark ? 'dark' : 'light'
        });
      });
    },
    async '$vuetify.theme.dark'(val) {
      this.updateOptions({
        theme: val ? 'dark' : 'light'
      });
      const tabs = await this.$browser.tabs.query({});
      tabs.forEach(tab => {
        this.$browser.tabs.sendMessage(tab.id, {
          theme: val ? 'dark' : 'light'
        });
      });
    },
    async supperDeveloperDialog(val) {
      if (val) {
        this.agreeSupport = await getRecords(
          'paytrackr_support_developer',
          false
        );
      }
    }
  },
  computed: {
    manifestVal() {
      return manifest;
    }
  }
};
</script>
