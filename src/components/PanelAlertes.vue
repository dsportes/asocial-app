<template>
<div class="spmd q-pa-sm">
  <ligne-alerte v-if="session.dlvat !== AMJ.max" :niv="3" code="PALdlvat" hlp="alerte_dlvat">
    <div class="q-ml-md">
      <span class="font-mono q-mr-md">{{dhcool(dlvatt, false, true)}}</span>
      <span :class="'font-mono' + (nbjat > 30 ? '' : ' msg2')">{{$t('dansjours', nbjat, {count: nbjat})}}</span>
    </div>
  </ligne-alerte>

  <div v-if="!ID.estComptable(session.compteId)">
    <ligne-alerte v-if="session.nbjDlv < config.alerteDlv" :niv="3" code="PALdlvc" hlp="alerte_dlvc">
      <div class="q-ml-md">
        <span class="font-mono q-mr-md">{{dhcool(dlvt, false, true)}}</span>
        <span class="font-mono msg2">{{$t('dansjours', session.nbjDlv, {count: session.nbjDlv})}}</span>
      </div>
    </ligne-alerte>
    <ligne-alerte v-else :niv="0" code="PALdlv" hlp="alerte_dlv">
      <div class="q-ml-md">
        <span class="font-mono q-mr-md">{{dhcool(dlvt, false, true)}}</span>
        <span class="font-mono">{{$t('dansjours', session.nbjDlv, {count: session.nbjDlv})}}</span>
      </div>
    </ligne-alerte>
  </div>

  <ligne-alerte v-if="session.hasAR" :niv="2" code="PALar" hlp="alerte_ar">
    <div class="q-ml-md fs-md">
      <div v-if="AL.has(session.flags, AL.ARSN)" class="q-my-xs">{{$t('PALars')}}</div>
      <div v-if="session.ntfP && session.ntfP.nr === 3" class="q-my-xs">{{$t('PALarp')}}</div>
      <div v-if="session.ntfC && session.ntfC.nr === 3" class="q-my-xs">{{$t('PALarc')}}</div>
    </div>
  </ligne-alerte>

  <ligne-alerte v-if="session.hasLS" :niv="1" code="PALls" hlp="alerte_ls">
    <div class="q-ml-md fs-md">
      <div v-if="session.ntfP && session.ntfP.nr === 2" class="q-my-xs">{{$t('PALarp')}}</div>
      <div v-if="session.ntfC && session.ntfC.nr === 2" class="q-my-xs">{{$t('PALarc')}}</div>
    </div>
  </ligne-alerte>

  <ligne-alerte v-if="session.hasNRED" :niv="1" code="PALnred" hlp="alerte_nr">
    <div class="q-ml-md fs-md">
      <span class="text-center font-mono">{{qv.qn * UNITEN}} [{{c.qv.qn}}]</span>
      <span class="text-right font-mono q-ml-md">{{p3(cqn)}}c</span>
    </div>
  </ligne-alerte>

  <ligne-alerte v-if="session.hasVRED" :niv="1" code="PALvred" hlp="alerte_vr">
    <div class="q-ml-md fs-md">
      <span class="text-center font-mono">{{edvol(qv.qv * UNITEV)}} [{{qv.qv}}]</span>
      <span class="text-right font-mono q-ml-md">{{pced(qv.v, qv.qv * UNITEV)}}</span>
    </div>
  </ligne-alerte>

  <ligne-alerte v-if="session.RAL" :niv="1" :code="'PALral' + oa" :hlp="'alerte_ral' + oa">
    <div class="q-ml-md fs-md">
      <div>{{$t('PALr')}}</div>
      <div class="q-ml-md fs-md">
        <div>{{$t('PALratt', [secRal])}}</div>
        <div class="font-mono">
          {{$t('PALexcjm', [qv.qc, p3(qv.cjm * 30), pced(qv.cjm * 30, qv.qc)])}}
        </div>
      </div>
    </div>
  </ligne-alerte>

  <q-separator v-if="session.ntfE" color="orange" class="q-mt-md"/>
  <ligne-alerte v-if="session.ntfE" :niv="session.espace.notifE.nr" code="PALesp" hlp="alerte_esp">
    <apercu-notif :idx="0" :type="0" simple
      :cible="session.ns" :notif="session.espace.notifE"/>
  </ligne-alerte>

  <div v-if="!session.estA">
    <q-separator color="orange" class="q-mt-md"/>

    <ligne-alerte :niv="nrx(session.ntfP)" code="PALpart" hlp="alerte_part">
      <apercu-notif :idx="0" :type="1" simple
        :cible="session.compte.idp" :notif="session.notifP"/>
    </ligne-alerte>

    <q-separator color="orange" class="q-mt-md"/>

    <ligne-alerte :niv="nrx(session.ntfC)" code="PALcpt" hlp="alerte_cpt">
      <apercu-notif :idx="0" :type="2" simple
        :cible="session.compteId" :notif="session.compte.notif"/>
    </ligne-alerte>
  </div>
</div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'

import stores from '../stores/stores.mjs'

import ApercuNotif from '../components/ApercuNotif.vue'

import BoutonHelp from '../components/BoutonHelp.vue'
import { $t, edvol, dhcool } from '../app/util.mjs'
import LigneAlerte from './LigneAlerte.vue'
import IconAlerte from './IconAlerte.vue'
import { AMJ, AL, Tarif, UNITEN, UNITEV, ID } from '../app/api.mjs'


const session = stores.session
const config = stores.config

const c = computed(() => session.compta.compteurs)
const cuj = computed(() => Tarif.cu(c.value.aaaa, c.value.mm))
const qv = computed(() => c.value.qv )
const cqn = computed(() => qv.value.qn * cuj.value[0])
const cqv = computed(() => qv.value.qv * cuj.value[1])
const nbdoc = computed(() => qv.value.nn + qv.value.nc + qv.value.ng)

const dlvatt = computed(() => AMJ.tDeAmjUtc(session.dlvat))
const nbjat = computed(() => AMJ.diff(session.dlvatt, session.auj))

const dlvt = computed(() => AMJ.tDeAmjUtc(session.dlv))
const oa = computed(() => session.estA ? 'A' : 'O')

const p3 = (x) => x === 0 ? '0' : (x < 0.01 ? '<0,01' : x.toPrecision(3))
const pc = (x, y) => y === 0 ? 999 : (x * 100) / y
const pced = (x, y) => { const q = pc(x, y)
  return q >= 999 ? '?' : (q === 0 ? '0%' : (q < 1 ? '<1%' : Math.round(q) + '%'))
}
const nrx = (ntf) => !ntf || !ntf.nr ? 0 : ntf.nr - 1

const secRal = computed(() => Math.round((1 + (AL.txRal(c.value.qv) / 10))))

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>