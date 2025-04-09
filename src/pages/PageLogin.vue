<template>
<q-page class="column align-start items-center">

  <div class="row self-end items-center">
    <div v-if="infx" class="font-mono fs-sm text-italic q-mr-sm">
      {{endp + config.BUILD + (session.srvBUILD ? ' / ' + session.srvBUILD : '')}}
    </div>
    <q-toggle :class="'q-my-xs bg-' + clrInfx " v-model="infx" color="grey-5" size="25px"/>
  </div>

  <div class="q-my-sm row justify-center items-center">
    <div class="titre-lg q-mr-sm">{{$t('PSorg1')}}</div>
    <nom-org v-model="orgE"/>
  </div>

  <q-expansion-item :disable="orgE.err !== ''" class="q-mt-xl spsm" group="g1">
    <template v-slot:header>
      <div class="full-width titre-lg row justify-between bord1">
        <div>{{$t('LOGconn2')}}</div>
      </div>
    </template>

    <div :class="orgE.err !== '' ? 'disabled' : ''">
      <div class="row q-mx-lg fullwidth">
        <q-expansion-item class="col titre-sm" :label="$t('LOGparano1')">
          <div class="row justify-center q-my-sm q-gutter-sm items-center">
            <div class="col-auto column items-center">
              <div class="titre-sm">{{$t('LOGparano2')}}</div>
              <div :class="'titre-sm text-italic ' + (chkp(parano) ? '' : 'bg-negative')">
                {{$t('LOGparah')}}
              </div>
            </div>
            <q-input filled v-model="parano" dense class="parano font-mono fs-sm" 
              counter maxlength="4"/>
            <q-select filled dense v-model="optVal" :options="optPar" class="w6 font-mono fs-sm"/>
          </div>
        </q-expansion-item>
        <bouton-help class="col-auto self-start" page="page_login_par"/>
      </div>

      <div class="row justify-center q-gutter-sm q-mt-sm">
        <btn-cond class="titre-lg" no-caps @ok="ouvrirPS(1)" :disable="orgE.org === 'admin'">
          <div class="row items-center q-gutter-sm">
            <q-icon size="sm"><img src="~assets/sync_saved_locally.svg"/></q-icon>
            <div>{{$t('sync')}}</div>
          </div>
        </btn-cond>

        <btn-cond class="titre-lg" no-caps @ok="ouvrirPS(2)">
          <div class="row items-center q-gutter-sm">
            <q-icon size="sm"><img src="~assets/incognito_blanc.svg"/></q-icon>
            <div>{{$t('incognito')}}</div>
          </div>
        </btn-cond>

        <btn-cond class="titre-lg" icon="airplanemode_active" no-caps  @ok="ouvrirPS(3)"
          :disable="orgE.org === 'admin'"
          :label="$t('avion')"/>
      </div>
    </div>
  </q-expansion-item>

  <q-expansion-item :disable="orgE.err !== '' || orgE.org === 'admin'" class="q-mt-xl spsm" group="g1">
    <template v-slot:header>
      <div class="full-width titre-lg row justify-between bord1">
        <div>{{$t('LOGconn3')}}</div>
      </div>
    </template>

    <div class="q-px-sm">
      <div class="titre-md q-my-md">{{$t('LOGpar')}}</div>
      <div class="col q-py-sm q-gutter-md row justify-center">
        <q-radio dense v-model="session.mode" :val="1">
          <div class="row items-center q-gutter-sm">
            <q-icon size="sm"><img src="~assets/sync_saved_locally.svg"/></q-icon>
            <div>{{$t('sync')}}</div>
          </div>
        </q-radio>
        <q-radio dense v-model="session.mode" :val="2">
          <div class="row items-center q-gutter-sm">
            <q-icon size="sm"><img src="~assets/incognito_blanc.svg"/></q-icon>
            <div>{{$t('incognito')}}</div>
          </div>
        </q-radio>
      </div>
      <phrase-contact v-if="session.mode" class="full-width" v-model="phraseE"/>
      <div v-if="session.mode" class="row justify-end items-center">
        <q-spinner v-if="encours" color="primary" class="q-mr-sm"
          size="1.5rem" :thickness="8" />
        <btn-cond :disable="orgE.err !== '' || phraseE.err !== ''" 
          icon="check" :label="$t('creer')" @ok="crypterphrase"/>
      </div>
    </div>
  </q-expansion-item>

  <!-- Dialogue d'acceptation d'un nouveau sponsoring -->
  <q-dialog v-if="ui.xD('ASaccsp', idc)" v-model="ui.d[idc].ASaccsp" full-height position="left" persistent>
    <acceptation-sponsoring :sp="sp" :pc="pc" :org="orgE.org"/>
  </q-dialog>

  <!-- Dialogue de demande de permission de notification -->
  <q-dialog v-if="ui.xD('pubsub', idc)" v-model="ui.d[idc].pubsub" persistent>
    <q-card :class="styp('sm') + ' q-pa-sm column items-center'">
      <!--div class="font-mono fs-xs">[{{perm}}]</div-->
      <div class="titre-lg q-my-md text-center">{{$t('LOGpubsub')}}</div>

      <btn-cond v-if="config.permState === 'prompt'" flat :label="$t('MLAntfr1')" @ok="demperm"/>
      <div v-else class="column justify-center">
        <div class="titre-lg text-italic text-center">{{$t('MLAntfr2')}}</div>
        <btn-cond class="q-my-md" flat :label="$t('jailu')" @ok="ui.fD()"/>
      </div>

    </q-card>
  </q-dialog>
</q-page>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const $t = useI18n().t

import stores from '../stores/stores.mjs'
import { ref, computed, onUnmounted } from 'vue'
import { decode } from '@msgpack/msgpack'

import { afficherDiag, beep, styp, sleep } from '../app/util.mjs'
import { connexion } from '../app/synchro.mjs'
import { Sponsoring, RegCles, Phrase } from '../app/modele.mjs'
import { AMJ } from '../app/api.mjs'
import PhraseContact from '../components/PhraseContact.vue'
import NomOrg from '../components/NomOrg.vue'
import AcceptationSponsoring from '../panels/AcceptationSponsoring.vue'
import BtnCond from '../components/BtnCond.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import { decrypter } from '../app/webcrypto.mjs'
import { CreationComptable, GetSponsoring } from '../app/operations4.mjs'

const config = stores.config
const session = stores.session

const optPar = [
  { label: $t('LOGopt1'), value: 30000 },
  { label: $t('LOGopt2'), value: 120000 },
  { label: $t('LOGopt3'), value: 300000 },
  { label: $t('LOGopt0'), value: -1 }
]

const optVal = ref(optPar[2])

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const clrInfx = computed(() => config.subJSON.startsWith('???') ? 'warning': 'green')
const endp = computed(() => config.subJSON.startsWith('???') ? config.subJSON + '... ': '')

const chkp = val => { 
  if (!val) return true
  if (val.length !== 4) return false
  for (let i = 0; i < val.length; i++) { 
    const c = val.charAt(i)
    if (c < '1' || c > '9') return false
  }
  return true
}

const encours = ref(false)
const infx = ref()
const btncd = ref()
const phraseE = ref({ phrase: '', err: ''})
const sp = ref()
const pc = ref()
const orgE = ref({ org: session.org || config.search || '', svc:'', err:'' })
const hTC = ref()
const cleE = ref()
const parano = ref('')

function raz () {
  btncd.value = false
  pc.value = null
  sp.value = null
  phraseE.value.phrase = ''
  parano.value = ''
}

raz()

async function demperm () {
  const p = await Notification.requestPermission()
  console.log('Notification: ', p)
  ui.fD()
}

function ouvrirPS (mode) {
  session.setMode(mode)
  ui.ps = { 
    login: true,
    labelValider: "LOGconn", 
    iconValider: "send",
    ok: onps
  }
  ui.oD('phrasesecrete', 'a')
}

function saisiePS () {
  ui.ps = {
    verif: true,
    labelValider: 'ok',
    ok: creationComptable
  }
  ui.oD('phrasesecrete', 'a')
}

async function onps (phrase) {
  config.setURLs(orgE.value.svc)
  if (phrase) phrase.phrase = null
  await connexion(phrase, ui.razdb, orgE.value.org)
  ui.setParano(parano.value || '', optVal.value.value)
  if (!config.silenceHome) await beep()
}

async function crypterphrase () {
  encours.value = true
  const p = new Phrase()
  await p.init(phraseE.value.phrase)
  // await sleep(5000)
  encours.value = false
  config.setURLs(orgE.value.svc)
  pc.value = p
  try {
    /* Recherche sponsoring *******/
    RegCles.reset()
    const mode = session.mode
    stores.reset(true)
    hTC.value = p.hpsc
    const res = await new GetSponsoring().run(orgE.value.org, p.hps1, p.hpsc)
    if (res && res.cleET) {
      if (res.cleET === false) {
        await afficherDiag($t('LOGnosp'))
        raz()
        return
      } else {
        try {
          cleE.value = await decrypter(p.pcb, res.cleET)
          saisiePS()
          return
        } catch (e) {
          await afficherDiag($t('LOGnosp2'))
          raz()
          return
        }
      }
    }
    if (!res || !res.rowSponsoring) {
      await afficherDiag($t('LOGnopp'))
      raz()
      return
    }
    try {
      const row = decode(res.rowSponsoring)
      session.setMode(mode)
      session.setOrg(orgE.value.org)
      sp.value = new Sponsoring()
      await sp.value.compileHS(row, p.pcb)
      if (sp.value.dlv <  AMJ.amjUtc()) {
        await afficherDiag($t('LOGppinv'))
        raz()
        return                  
      }
      if (sp.value.st !== 0) {
        await afficherDiag($t('LOGsp' + sp.value.st))
        raz()
        return                  
      }
      ui.oD('ASaccsp', idc)
    } catch (e) {
      await afficherDiag($t('LOGppatt'))
      raz()        
    }
  } catch (e) {
    console.log('crypterphrase: ' + e)
    raz()
  }
}

async function creationComptable (pc) {
  await new CreationComptable().run(org.value, pc, cleE.value, hTC.value)
  await afficherDiag($t('LOGcrec'))
}

setTimeout(() => {
  if (!config.permission) 
    ui.oD('pubsub', idc)
}, 1000)

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.parano
  width: 4rem
.w6
  width: 7rem
.bord1
  border-bottom: 1px solid $orange
.disabled
  pointer-events: none
  opacity: 0.4
</style>
