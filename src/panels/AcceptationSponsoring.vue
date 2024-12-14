<template>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="tbp">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('NPtit')}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-pa-sm">
    <q-stepper v-model="step" vertical color="primary" animated>
      <q-step name="0" :title="$t('NPst' + sp.st, [dhcool(sp.dh)])"
          class="titre-md" icon="settings" :done="step > '0'">

        <div class="titre-md">{{$t('NPphr')}}
          <span class="q-ml-sm font-mono text-bold fs-md">{{pc.phrase}}</span>
        </div>
        <div class="titre-md">{{$t('NPdlv')}}
          <span class="q-ml-sm font-mono text-bold fs-md">{{AMJ.editDeAmj(sp.dlv)}}</span>
        </div>
        <div class="titre-md">{{$t('NPnom')}}
          <span class="text-bold font-mono q-px-md">{{sp.nom}}</span>
        </div>
        <div class="q-mt-md titre-md">{{$t('NPsponsor')}}</div>
        <div class="row items-start">
          <img class="photomax col-auto q-mr-sm" :src="sp.cv.photo" />
          <div class="col column">
            <div>
              <span class="text-bold fs-md q-mr-sm">{{sp.cv.nomc}}</span> 
              <span class="text-bold fs-sm font-mono q-mr-sm">#{{sp.cv.id}}</span> 
            </div>
            <show-html v-if="sp.cv.texte" class="q-my-xs border1" zoom maxh="4rem" :texte="sp.cv.texte"/>
            <div v-else class="text-italic">{{$t('FAnocv')}}</div>
          </div>
        </div>

        <div v-if="sp.estA" class="text-warning titre-md text-bold">{{$t('compteA')}}</div>
        <div v-if="sp.don" class="titre-md">{{$t('NPdon', [sp.don])}}</div>

        <div v-if="sp.dconf">{{$t('conf')}}</div>

        <div :class="'titre-md ' + (sp.del ? 'text-warning' : 'text.primary')">
          {{$t(sp.del ? 'compteD' : 'compteO', [sp.partitionId])}}
        </div>

        <div class="titre-md">{{$t('NPquo')}}</div>
        <quotas-vols class="q-ml-md" :vols="sp.quotas"/>

        <div class="titre-md q-mt-xs">{{$t('NPmot')}}</div>
        <show-html class="q-mb-xs border1" zoom maxh="4rem" :texte="sp.ard"/>

        <q-stepper-navigation class="font-def" >
          <btn-cond flat @ok="ui.fd" icon="undo" :label="$t('renoncer')"/>
          <btn-cond class="q-ml-sm" @ok="step='1'" :label="$t('NPacc')"/>
          <btn-cond class="q-ml-sm" @ok="step='2'" :label="$t('NPdec')"/>
        </q-stepper-navigation>
      </q-step>

      <q-step name="1" :title="$t('NPacc')" class="titre-md" icon="check" :done="step > '1'">
        <div v-if="ps">
          <q-checkbox v-if="!sp.dconf" class="titre-md text-bold" size="md" dense 
              left-label v-model="dconf" :label="$t('APAcf2', [sp.cv.nom])" />
          <div class="titre-md q-mt-sm">{{$t('NPmota')}}</div>
          <editeur-md mh="10rem" v-model="texte" :texte="textedef" editable modetxt/>
          
          <q-stepper-navigation class="font-def">
            <btn-cond flat @ok="step='0'" :label="$t('precedent')" class="q-ml-sm" />
            <btn-cond flat class="q-ml-sm" @ok="fermer" :label="$t('renoncer')"/>
            <btn-cond class="q-ml-sm" @ok="confirmer" :disable="texte.length === 0"
              color="warning" :label="$t('APAconf')"/>
          </q-stepper-navigation>
        </div>
      </q-step>

      <q-step name="2" :title="$t('NPdec')" class="titre-md" icon="ckeck" :done="step > '2'">
        <div class="titre-md q-mt-sm">{{$t('NPmotd')}}</div>
        <editeur-md mh="10rem" v-model="texte" :texte="textedef" editable modetxt/>
      
        <q-stepper-navigation class="font-def">
          <btn-cond flat @ok="step='0'" :label="$t('precedent')" class="q-ml-sm" />
          <btn-cond flat class="q-ml-sm" @ok="fermer" :label="$t('renoncer')"/>
          <btn-cond @ok="refuser" color="warning" :disable="texte.length === 0"
            :label="$t('APAdec2')" class="q-ml-sm" />
        </q-stepper-navigation>
      </q-step>
    </q-stepper>
    </q-page>
  </q-page-container>
</q-layout>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const $t = useI18n().t

import { ref, onUnmounted, computed, watch } from 'vue'

import stores from '../stores/stores.mjs'
import EditeurMd from '../components/EditeurMd.vue'
import ShowHtml from '../components/ShowHtml.vue'
import { connexion, deconnexion } from '../app/synchro.mjs'
import { AcceptationSponsoring, RefusSponsoring, ExistePhrase } from '../app/operations4.mjs'
import QuotasVols from '../components/QuotasVols.vue'
import BtnCond from '../components/BtnCond.vue'
import { styp, dhcool, afficherDiag } from '../app/util.mjs'
import { AMJ, ID } from '../app/api.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const props = defineProps({ 
  sp: Object, // objet Sponsoring décodé
  pc: Object, // objet Phrase
  org: String
})

const textedef = computed(() => $t('merci', [props.sp.cv.nom]))

const step = ref('0')
const isPwd = ref(false)
const jourJ = ref(AMJ.amjUtc())
const max = ref([1, 1])
const ps = ref(null)
const apsf = ref(false)
const texte = ref(textedef.value)
const npi = ref(false)
const dconf = ref(false)

watch(step, (ap, av) => {
  if (ap === '1' && !ps.value) {
    ui.ps = {
      labelValider: 'ok',
      verif: true,
      orgext: props.org,
      ok: okps,
      initVal: ps.value ? ps.value.phrase : ''
    }
    ui.oD('phrasesecrete', 'a')
  } else ps.value = null
})

function clr (sp) { return ['primary', 'warning', 'green-5', 'negative'][props.sp.st] }
    
function fermer () {
  texte.value = ''
  apsf.value = false
  isPwd.value = false
  ps.value = null
  ui.fD()
}

async function okps (p) {
  if (p) {
    if (await new ExistePhrase().run(p.hps1, 1)) {
      await afficherDiag($t('existe'))
      step.value = '0'
      return
    }
    ps.value = p
  }
}

async function confirmer () {
  const x = ps.value
  await new AcceptationSponsoring().run(props.org, props.sp, texte.value, x, dconf.value)
  fermer()
  await connexion(x)
}

async function refuser () {
  await new RefusSponsoring().run(props.sp, texte.value + '\n\n' + props.sp.ard)
  fermer()
  await deconnexion()
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.border1
  border-top: 1px solid $grey-5
  border-bottom: 1px solid $grey-5
.q-stepper--bordered
  border: none
.q-stepper__tab
  padding: 10px 0 !important
.q-stepper__step-inner
  padding: 0px 2px 2px 18px !important
.q-stepper__nav
  padding: 5px 0 !important
</style>
