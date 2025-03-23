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
      <btn-cond v-if="!session.estComptable && immuable === 0" 
        class="q-mt-xs" cond="cUrgence"
        color="warning" icon="close" :label="$t('supprimer')" @ok="deltk"/>
      <btn-cond v-if="session.estComptable && immuable === 0" 
        class="q-mt-xs" cond="cUrgence"
        color="warning" icon="check" :label="$t('TKenreg1')" @ok="recep1"/>
      <btn-cond v-if="session.estComptable && immuable === 0" 
        class="q-ml-xs q-mt-xs" cond="cUrgence"
        color="warning" icon="check" :label="$t('TKenreg2')" @ok="recep2"/>
      <div v-if="!session.estComptable && immuable === 1" class="text-italic q-my-xs">
        {{$t('TKimu1')}}
      </div>
      <div v-if="!session.estComptable && immuable === 2" class="text-italic q-my-xs">
        {{$t('TKimu2a')}}
      </div>
      <div v-if="session.estComptable && immuable === 2" class="text-italic q-my-xs">
        {{$t('TKimu2b')}}
      </div>
      <q-separator class="q-mb-sm" size="3px"/>
    </div>
  </q-expansion-item>

  <q-dialog v-model="ui.d[idc].ATdialtk" persistent>
    <panel-dialtk :min="5" :init="tk.ma" titre="TKrec" @ok="reception"/>
  </q-dialog>

  <q-dialog v-model="ui.d[idc].ATconfirmdel">
    <q-card :class="styp('sm')">
      <q-card-section class="q-pa-md fs-md text-center">
        {{$t('TKdel')}}</q-card-section>
      <q-card-actions align="right" class="q-gutter-sm">
        <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
        <btn-cond color="warning" icon="delete" cond="cUrgence"
          :label="$t('TKdel2')" @ok="deletetk"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { $t, mon, dkli, styp } from '../app/util.mjs'
import { AMJ, idTkToL6 } from '../app/api.mjs'
import PanelDialtk from '../components/PanelDialtk.vue'
import BtnCond from '../components/BtnCond.vue'
import { MoinsTicket, ReceptionTicket } from '../app/operations4.mjs'

const session = stores.session
const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const props = defineProps({
  tk: Object,
  idx: Number 
})

const aMj = computed(() => {
  const [a, m, j] = AMJ.aaaammjj(props.tk.dg)
  const mx = $t('mois' + m)
  return { a: a, m: mx, j: j }
})
// immuable: ticket réceptionné ou émis avant M-2
const immuable = computed(() => {
  if (props.tk.dr) return 1
  const [a, m, j] = AMJ.aaaammjj(props.tk.dg)
  const [am, mm, jm] = AMJ.aaaammjj(AMJ.amjUtc())
  let mp = mm - 1, ap = am
  if (mp === 0) { mp = 12; ap--}
  return (a === am && m === mm) || (a === ap && m === mp) ? 0 : 2
})
const mt = computed(() => mon(!props.tk.dr ? props.tk.ma : props.tk.mc))
const cmt = computed(() => !props.tk.dr || (props.tk.ma === props.tk.mc) ? '' : 'bg-yellow-3 text-negative')
const st = computed(() => $t('TK' + (props.tk.dr ? 2 : 1)))

async function deltk () { ui.oD('ATconfirmdel', idc) }

async function deletetk () { 
  ui.fD()
  await new MoinsTicket().run(props.tk.ids)
}

async function recep1 () { 
  await new ReceptionTicket().run(props.tk.ids, props.tk.ma, '')
  ui.fD()
}

async function recep2 () { ui.oD('ATdialtk', idc) }

async function reception ({m, ref}) {
  await new ReceptionTicket().run(props.tk.ids, m, ref)
  ui.fD()
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
