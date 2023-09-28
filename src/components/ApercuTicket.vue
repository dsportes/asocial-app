<template>
  <q-expansion-item switch-toggle-side dense :class="dkli(idx) + ' full-width'">
    <template v-slot:header>
      <div class="row full-width items-center">
        <div class="col-auto text-bold fs-lg font-mono">{{iToL6(tk.ids)}}</div>
        <div class="col q-ml-md row items-center">
          <div class="col-8 row items-center">
            <div class="fs-md font-mono">{{aMj.j}}</div>
            <div class="q-ml-xs titre-md">{{aMj.m}}</div>
            <div class="q-ml-xs fs-md font-mono">{{aMj.a}}</div>
          </div>
          <div class="col-2 text-center" :class="cmt + ' q-px-xs fs-md'">{{mt}}</div>
          <div class="col-2 text-right fs-sm">{{st}}</div>
        </div>
      </div>
    </template>
    <div class="q-ml-lg">
      <div class="row fs-md">
        <div class="col-4">{{$t('TKdg', [AMJ.editDeAmj(tk.dg)])}}</div>
        <div class="col-4"><span v-if="tk.dr">{{$t('TKdr', [AMJ.editDeAmj(tk.dr)])}}</span></div>
        <div class="col-4"><span v-if="tk.di">{{$t('TKdi', [AMJ.editDeAmj(tk.di)])}}</span></div>
      </div>
      <div class="row">
        <div class="fs-md text-italic">{{$t('TKmd')}}</div>
        <div class="font-mono fs-md text-bold q-ml-sm">{{mon(tk.ma)}}</div>
        <div v-if="tk.dr && tk.ma !== tk.mc" class="q-ml-lg fs-md text-italic">{{$t('TKmr')}}</div>
        <div v-if="tk.dr && tk.ma !== tk.mc" class="bg-yellow-3 text-negative q-px-xs font-mono fs-md text-bold q-ml-sm">
          {{mon(tk.mc)}}
        </div>
      </div>
      <div v-if="tk.refa">
        <span class="text-italic fs-md">{{$t('TKrefa')}}</span>
        <span class="q-ml-sm font-mono text-bold">{{tk.refa}}</span>
      </div>
      <div v-if="tk.refc">
        <span class="text-italic fs-md">{{$t('TKrefc')}}</span>
        <span class="q-ml-sm font-mono text-bold">{{tk.refc}}</span>
      </div>
      <q-separator class="q-mb-sm" size="3px"/>
    </div>
  </q-expansion-item>
</template>
<script>

import { toRef } from 'vue'
import { mon, iToL6, dkli } from '../app/util.mjs'
import { AMJ } from '../app/api.mjs'

export default {
  name: 'ApercuTicket',

  props: { tk: Object, idx: Number },

  components: { },

  computed: { 
    aMj () {
      const [a, m, j] = AMJ.aaaammjj(this.tk.dg)
      const mx = this.$t('mois' + m)
      return { a: a, m: mx, j: j }
    },
    mt () { return mon(!this.tk.dr ? this.tk.ma : (this.tk.ma > this.tk.mc ? this.tk.mc : this.tk.ma)) },
    cmt () { return !this.tk.dr || (this.tk.ma === this.tk.mc) ? '' : 'bg-yellow-3 text-negative'},
    st () { const i = this.tk.di ? 3 : (this.tk.dr ? 2 : 1); return this.$t('TK' + i)},
  },

  data () { return {
  }},

  methods: {
  },

  setup (props) {
    const t = toRef(props, 'tk')
    return {
      iToL6, mon, dkli, AMJ
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
