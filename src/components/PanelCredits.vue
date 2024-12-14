<template>
<div class="spmd q-pa-sm">
  <div v-if="session.estComptable" class="q-mb-sm">
    <div class="titre-md">{{$t('PEsttk')}}</div>
    <div class="row q-gutter-sm q-mb-sm">
      <btn-cond class="self-start b1" label="M" @ok="dlstat(0)"/>
      <btn-cond class="self-start b1" label="M-1" @ok="dlstat(1)"/>
      <btn-cond class="self-start b1" label="M-2" @ok="dlstat(2)"/>
      <btn-cond class="self-start b1" label="M-3" @ok="dlstat(3)"/>
      <saisie-mois v-model="mois" :dmax="maxdl" :dmin="mindl" :dinit="maxdl"
        @ok="dlstat2" icon="download" :label="$t('ESdlc')"/>
    </div>
  </div>

  <btn-cond class="q-my-xs" cond="cUrgence" icon="add" :label="$t('TKnv')" 
    @ok="nvtk"/>

  <div v-if="session.compta">
    <q-expansion-item switch-toggle-side dense group="tkdon"
      header-class="titre-md text-bold tbp"
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

    <q-expansion-item switch-toggle-side dense group="tkdon"
      header-class="titre-md text-bold tbp"
      :label="$t('TKdons')">
      <div v-if="lstDons.length === 0" class="q-mt-md text-center text-italic titre-md">{{$t('TKndon')}}</div>
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

  <q-dialog v-model="ui.d[idc].PCdialtk" persistent>
    <panel-dialtk :min="50" :init="0" titre="TKnv" @ok="generer"/>
  </q-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { saveAs } from 'file-saver'
import stores from '../stores/stores.mjs'
import ApercuTicket from '../components/ApercuTicket.vue'
import PanelDialtk from '../components/PanelDialtk.vue'
import BtnCond from '../components/BtnCond.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import SaisieMois from '../components/SaisieMois.vue'
import { $t, dhcool, mon, dkli, styp, afficherDiag } from '../app/util.mjs'
import { PlusTicket, TicketsStat } from '../app/operations4.mjs'
import { AMJ, idTkToL6, ID } from '../app/api.mjs'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const session = stores.session
const aSt = stores.avatar

const dhinc = ref(0)
const nbinc = ref(0)
const att = ref('A')
const deb = ref('')
const mois = ref(Math.floor(session.auj / 100))

const c = computed(() => session.estComptable ? null : session.compta.compteurs)

const lstTk = computed(() => {
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
  if (session.estComptable) src =  aSt.getTickets
  else {
    const ltk = session.compta.tickets
    for(const ids in ltk) src.push(ltk[ids])
  } 
  
  const l = filtre(src, att.value, deb.value)
  if (att.value === 'A') l.sort((a, b) => { return a.dg < b.dg ? 1 : (a.dg === b.dg ? 0 : -1) })
  else l.sort((a, b) => { return a.dg < b.dg ? 1 : (a.dg === b.dg ? 0 : -1) })
  return l
})

const lstDons = computed(() => {
  const t = session.compta.dons || []
  t.sort((a, b) => { return a.dh < b.dh ? 1 : (a.dh === b.dh ? 0 : -1) })
  return t
})

const maxdl = computed(() => Math.floor(AMJ.djMoisN(AMJ.amjUtc(), -1) / 100))
const mindl = computed(() => Math.floor(session.espace.dcreation / 100))

async function dlstat (mr) {
  const { err, blob, creation, mois } = await new TicketsStat().run(mr)
  const nf = session.espace.org + '-T_' + mois
  if (!err) {
    saveAs(blob, nf)
    await afficherDiag($t('PEsd', [nf]))
  } else {
    await afficherDiag($t('PEnd' + err))
  }
}

async function dlstat2 () {
  const aj = Math.floor(AMJ.amjUtc() / 100)
  const mr = AMJ.nbMois(mois.value, aj)
  const { err, blob } = await new TicketsStat().run(mr)
  const nf = session.org + '-T_' + mois.value
  if (!err) {
    saveAs(blob, nf)
    await afficherDiag($t('PEsd', [nf]))
  } else {
    await afficherDiag($t('PEnd' + err))
  }
}

async function nvtk () { ui.oD('PCdialtk', idc) }

async function generer ({m, ref}) {
  const [ax, mx, j] = AMJ.aaaammjj(AMJ.amjUtc())
  const ids = ID.dunTicket(ax, mx)
  const tkx = idTkToL6(ids)
  ui.fD()
  await new PlusTicket().run(m, ref, ids)
  await afficherDiag($t('TKrefp', [session.org, tkx]))
}

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
