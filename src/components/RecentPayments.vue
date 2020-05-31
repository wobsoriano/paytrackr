<template>
  <div>
    <v-list three-line subheader v-show="items.length">
      <v-subheader>Payment Streams</v-subheader>
      <template v-for="(i, idx) in payments">
        <v-divider inset :key="idx" v-if="idx !== 0"></v-divider>
        <v-list-item :key="i.id">
          <v-list-item-avatar>
            <v-icon>mdi-contactless-payment</v-icon>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title v-text="`${i.scaledAmount} ${i.assetCode}`"></v-list-item-title>
            <v-list-item-subtitle>
              <a target="_BLANK" :href="i.url" v-text="i.url"></a>
            </v-list-item-subtitle>
            <v-list-item-subtitle>{{ i.date | filterDate }}</v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-menu bottom left>
              <template v-slot:activator="{ on }">
                <v-btn v-on="on" icon>
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  @click="
                    selectedItem = i;
                    infoDialog = true;
                  "
                >
                  <v-list-item-title>More info</v-list-item-title>
                </v-list-item>
                <v-list-item :href="i.url" target="_BLANK">
                  <v-list-item-title>Visit site</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-list-item-action>
        </v-list-item>
      </template>
    </v-list>
    <div class="text-center" v-if="showLoadMore">
      <v-btn text @click="loadMore" class="mb-3">Load More</v-btn>
    </div>
    <tab-placeholder v-if="!items.length">
      <h4>No payments found.</h4>
      <p>Start supporting content creators by visiting their site!</p>
    </tab-placeholder>
    <v-dialog v-model="infoDialog">
      <v-card>
        <v-card-title>Payment Info</v-card-title>
        <v-card-text>
          <p>Payment Pointer: {{ selectedItem.paymentPointer }}</p>
          <p>Total amount: {{ selectedItem.scaledAmount }}</p>
          <p>Asset Scale: {{ selectedItem.assetScale }}</p>
          <p>Asset Code: {{ selectedItem.assetCode }}</p>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { getRecords } from '../utils';

export default {
  props: ['realTimePopup'],
  data: () => ({
    items: [],
    initialItems: [],
    loading: true,
    itemsPerPage: 10,
    page: 1,
    showLoadMore: false,
    infoDialog: false,
    selectedItem: {}
  }),
  async mounted() {
    this.loading = true;
    await this.fetchHistory();
    this.loading = false;

    if (this.realTimePopup) {
      this.$browser.storage.onChanged.addListener(this.onChangeListener);
    }
  },
  beforeDestroy() {
    this.$browser.storage.onChanged.removeListener(this.onChangeListener);
  },
  methods: {
    onChangeListener(changes) {
      if (changes['paytrackr_history']) {
        const newValue = changes['paytrackr_history'].newValue;

        if (!newValue.length) {
          this.items = [];
          this.initialItems = [];
          this.page = 1;
          this.showLoadMore = false;
          return;
        }

        if (!this.items.length) {
          this.items = newValue;
          return;
        }

        for (var i = 0; i < newValue.length; i++) {
          const itemIdx = this.items.findIndex(
            item => item.id === newValue[i].id
          );
          if (itemIdx !== -1) {
            this.items[itemIdx].scaledAmount = Number(
              newValue[i].scaledAmount
            ).toFixed(9);
          } else {
            if (!this.realTimePopup) {
              this.items.unshift(newValue[i]);
            }
          }
        }
      }
    },
    async fetchHistory() {
      this.page = 1;
      try {
        this.initialItems = (await getRecords('paytrackr_history')).sort(
          (a, b) => b.date - a.date
        );
        this.items = this.paginate(
          this.initialItems,
          this.itemsPerPage,
          this.page
        );

        if (this.items.length === this.itemsPerPage) {
          this.page++;
          this.showLoadMore = true;
        }
      } catch (e) {
        console.log(e);
      }
    },
    paginate(array, page_size, page_number) {
      return array.slice(
        (page_number - 1) * page_size,
        page_number * page_size
      );
    },
    loadMore() {
      const newItems = this.paginate(
        this.initialItems,
        this.itemsPerPage,
        this.page
      );
      this.items = [...this.items, ...newItems];
      if (newItems.length === this.itemsPerPage) {
        this.page++;
      } else {
        this.showLoadMore = false;
      }
    }
  },
  computed: {
    payments() {
      return this.items.sort((a, b) => b.date - a.date);
    }
  },
  watch: {
    realTimePopup(val) {
      if (this.realTimePopup) {
        this.$browser.storage.onChanged.addListener(this.onChangeListener);
      } else {
        this.$browser.storage.onChanged.removeListener(this.onChangeListener);
      }
    }
  }
};
</script>
