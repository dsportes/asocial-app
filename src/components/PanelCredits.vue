<template>
<div class="spmd q-pa-sm">
  <div class="q-mb-sm">
    <div class="titre-md">{{$t('PEsttk')}}</div>
    <div class="row q-gutter-sm q-mb-sm">
      <btn-cond class="self-start b1" label="M" @click="dlstat(0)"/>
      <btn-cond class="self-start b1" label="M-1" @click="dlstat(1)"/>
      <btn-cond class="self-start b1" label="M-2" @click="dlstat(2)"/>
      <btn-cond class="self-start b1" label="M-3" @click="dlstat(3)"/>
      <saisie-mois v-model="mois" :dmax="maxdl" :dmin="mindl" :dinit="maxdl"
        @ok="dlstat2" icon="download" :label="$t('ESdlc')"/>
    </div>
  </div>

<!--
  <btn-cond dense color="warning" padding="none xs" size="md" no-caps
    label="Test-Stat-T" @click="dlstat"/>

  <div v-if="session.estComptable" class="row justify-start items-center">
    <div class="titre-md q-mr-md">{{$t('PEsttk')}}</div>
    <q-input class="w10" v-model="mois" :label="$t('ESmois')" :hint="$t('ESmois2')" dense clearable>
      <template v-slot:append>
        <q-icon name="download" @click="dlstat2" class="cursor-pointer" color="warning"/>
      </template>
    </q-input>
  </div>
  -->

  <!--panel-deta v-if="!session.estComptable" :c="c" :total="aSt.compta.credits.total"
    class="q-ma-xs q-pa-xs bord1"/-->

  <btn-cond v-if="!session.estComptable" class="q-my-xs" cond="cUrgence"
    icon="add" :label="$t('TKnv')" @ok="nvtk"/>

  <div v-if="session.compta">
    <q-expansion-item switch-toggle-side dense group="tkdon"
      header-class="titre-md text-bold bg-primary text-white"
      :label="$t('TK' + (session.estComptable ? '1' : '2') + att)">
      <div class="row justify-center">
        <q-radio v-model="att" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" 
          val="A" :label="$t('TKatt')" class="q-mr-lg"/>
        <q-radio v-model="att" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" 
          val="T" :label="$t('tous')" />
      </div>
      <div v-if="session.estComptable" class="q-mt-sm row justify-center">
        <div class="row items-center">
          <span class="text-italic fs-md q-mr-md">{{$t('TKdeb')}}</span>
          <q-input class="lg2" dense v-model="deb" clearable counter maxlength="6">
            <template v-slot:hint>{{$t('TKdebh')}}</template>
          </q-input>
        </div>
      </div>
      <div v-for="(tk, idx) in lstTk" :key="tk.ids" class="q-ml-md">
        <apercu-ticket :tk="tk" :idx="idx"/>
      </div>
    </q-expansion-item>

    <q-separator size="3px"/>

    <q-expansion-item v-if="!session.estComptable" switch-toggle-side dense group="tkdon"
      header-class="titre-md text-bold bg-primary text-white"
      :label="$t('TKdons')">
      <div v-for="(d, idx) in lstDons" :key="idx" class="q-ml-md">
        <div class="row justify-between">
          <div v-if="d.m > 0">{{$t('TKcr', [d.m])}}</div>
          <div v-else>{{$t('TKdb', [-d.m])}}</div>
          <div class="font-mono">{{dhcool(d.dh)}}</div>
        </div>
        <apercu-genx :id="d.iddb" :idx="0"/>
        <q-separator color="grey-5" class="q-mb-md"/>
      </div>
    </q-expansion-item>

  </div>

  <q-dialog v-model="ui.d.PCdialtk[idc]" persistent>
    <panel-dialtk :min="50" :init="0" titre="TKnv" @ok="generer"/>
  </q-dialog>

  </div>
</template>

<script>
import { saveAs } from 'file-saver'
import stores from '../stores/stores.mjs'
import ApercuTicket from '../components/ApercuTicket.vue'
import PanelDialtk from '../components/PanelDialtk.vue'
import BtnCond from '../components/BtnCond.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import SaisieMois from '../components/SaisieMois.vue'
import { $t, dhcool, mon, dkli, genIdTk, styp, afficherDiag } from '../app/util.mjs'
import { PlusTicket, TicketsStat } from '../app/operations4.mjs'
import { AMJ, idTkToL6, ID } from '../app/api.mjs'

export default ({
  name: 'PanelCredits',

  props: { },

  components: { ApercuGenx, BtnCond, ApercuTicket, PanelDialtk, SaisieMois },

  computed: {
    c () { return this.session.estComptable ? null : this.session.compta.compteurs },

    lstTk () {
      function filtre (l, att, deb) {
        const r = []
        if (att === 'A' || deb !== '') { 
          const d = deb.toUpperCase()
          l.forEach(tk => { 
            const c1 = d ? idTkToL6(tk.ids).startsWith(d) : true
            const c2 = (att === 'A' && tk.dr === 0) || att !== 'A'
            if (c1 && c2) r.push(tk)
          })
          return r 
        }
        return l
      }

      let src = []
      if (this.session.estComptable) src =  this.aSt.getTickets
      else {
        const ltk = this.session.compta.tickets
        for(const ids in ltk) src.push(ltk[ids])
      } 
      
      const l = filtre(src, this.att, this.deb)
      if (this.att === 'A') l.sort((a, b) => { return a.dg < b.dg ? 1 : (a.dg === b.dg ? 0 : -1) })
      else l.sort((a, b) => { return a.dg < b.dg ? 1 : (a.dg === b.dg ? 0 : -1) })
      return l
    },
    lstDons () {
      const t = this.session.compta.dons || []
      t.sort((a, b) => { return a.dh < b.dh ? 1 : (a.dh === b.dh ? 0 : -1) })
      return t
    },
    maxdl () { 
      const m = AMJ.djMoisN(AMJ.amjUtc(), -1)
      return Math.floor(m / 100)
    },
    mindl () { 
      return Math.floor(this.session.espace.dcreation / 100)
    },
  },

  data () {
    return {
      dhinc: 0,
      nbinc: 0,
      att: 'A', 
      deb: '',
      mois: Math.floor(this.session.auj / 100)
    }
  },

  methods: {
    async dlstat (mr) {
      const { err, blob, creation, mois } = await new TicketsStat().run(mr)
      const nf = this.session.espace.org + '-T_' + mois
      if (!err) {
        saveAs(blob, nf)
        await afficherDiag($t('PEsd', [nf]))
      } else {
        await afficherDiag($t('PEnd' + err))
      }
    },

    async dlstat2 () {
      const aj = Math.floor(AMJ.amjUtc() / 100)
      const mr = AMJ.nbMois(this.mois, aj)
      const { err, blob } = await new TicketsStat().run(mr)
      const nf = this.session.org + '-T_' + this.mois
      if (!err) {
        saveAs(blob, nf)
        await afficherDiag($t('PEsd', [nf]))
      } else {
        await afficherDiag($t('PEnd' + err))
      }
    },

    async nvtk () {
      this.ui.oD('PCdialtk', this.idc)
    },

    async generer ({m, ref}) {
      const [ax, mx, j] = AMJ.aaaammjj(AMJ.amjUtc())
      const ids = genIdTk(ax, mx)
      const tkx = idTkToL6(ids)
      this.ui.fD()
      await new PlusTicket().run(m, ref, ids)
      await afficherDiag(this.$t('TKrefp', [this.session.org, tkx]))
    }

  },

  setup () {
    const ui = stores.ui
    return {
      styp, mon, dhcool, dkli, AMJ, ID,
      session: stores.session,
      aSt: stores.avatar,  
      ui, 
      idc: ui.getIdc()
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 1px solid $grey-5
  border-radius: 5px
.lg2
  width: 8rem
.w10
  width: 10rem
.b1
  width: 4rem
</style>
