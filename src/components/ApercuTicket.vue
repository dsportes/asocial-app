<template>
  <q-expansion-item switch-toggle-side dense :class="dkli(idx) + ' full-width'" group="gr1">
    <template v-slot:header>
      <div class="row full-width items-center">
        <div class="col-auto text-bold fs-md font-mono">{{idTkToL6(tk.ids)}}</div>
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
        <div>{{$t('TKdg', [AMJ.editDeAmj(tk.dg)])}}</div>
        <div v-if="tk.dr" class="q-ml-md">{{$t('TKdr', [AMJ.editDeAmj(tk.dr)])}}</div>
        <div v-if="tk.di" class="q-ml-md">{{$t('TKdi', [AMJ.editDeAmj(tk.di)])}}</div>
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
      <q-btn v-if="!session.estComptable && !Ticket.estObsolete(tk)" class="q-mt-xs"
        dense color="warning" icon="close" :label="$t('supprimer')" @click="deltk"/>
      <q-btn v-if="session.estComptable && !Ticket.estObsolete(tk)" class="q-mt-xs"
        dense color="warning" icon="check" :label="$t('TKenreg1')" @click="recep1"/>
      <q-btn v-if="session.estComptable && !Ticket.estObsolete(tk)" class="q-ml-xs q-mt-xs"
        dense color="warning" icon="check" :label="$t('TKenreg2')" @click="recep2"/>
      <q-separator class="q-mb-sm" size="3px"/>
    </div>
  </q-expansion-item>

  <q-dialog v-model="ui.d.ATdialtk[idc]" persistent>
    <panel-dialtk :min="5" :init="tk.ma" titre="TKrec" @ok="reception"/>
  </q-dialog>

  <q-dialog v-model="ui.d.ATconfirmdel[idc]">
    <q-card :class="styp('sm')">
      <q-card-section class="q-pa-md fs-md text-center">
        {{$t('TKdel')}}</q-card-section>
      <q-card-actions align="right" class="q-gutter-sm">
        <q-btn flat dense padding="xs" size="md" color="primary" icon="undo"
          :label="$t('renoncer')" @click="ui.fD"/>
        <q-btn dense padding="xs" size="md" color="warning" icon="delete" 
          :label="$t('TKdel2')" @click="deletetk"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</template>
<script>

import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { mon, dkli, styp, afficherDiag } from '../app/util.mjs'
import { AMJ, idTkToL6 } from '../app/api.mjs'
import PanelDialtk from '../components/PanelDialtk.vue'
import { Ticket } from '../app/modele.mjs'
import { ReceptionTicket, MoinsTicket } from '../app/operations.mjs'

export default {
  name: 'ApercuTicket',

  props: { tk: Object, idx: Number },

  components: { PanelDialtk },

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
    async deltk () {
      if (!await this.session.editUrgence()) return
      this.ui.oD('ATconfirmdel', this.idc)
    },
    async recep1 () {      
      if (!await this.session.editUrgence()) return
      await this.reception ({ m: this.tk.ma, ref: ''})
    },
    async recep2 () {      
      if (!await this.session.editUrgence()) return
      this.ui.oD('ATdialtk', this.idc)
    },
    async reception ({m, ref}) {
      this.ui.fD()
      await new ReceptionTicket().run(this.tk.ids, m, ref)
    },
    async deletetk () {
      this.ui.fD()
      await new MoinsTicket().run(this.tk.ids)
    }
  },

  setup (props) {
    const session = stores.session
    const ui = stores.ui
    const idc = ref(ui.getIdc())
    // const t = toRef(props, 'tk')

    return {
      idTkToL6, mon, dkli, AMJ, Ticket, session, ui, idc, styp
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
