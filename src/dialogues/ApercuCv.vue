<template>
  <q-card :class="styp('sm') + 'column'">
    <q-toolbar class="col-auto tbs">
      <btn-cond color="warning" icon="close" @ok="ui.fD"/>
      <btn-cond v-if="net" class="q-ml-xs" round icon="refresh" cond="cVisu" @ok="refresh">
        <q-tooltip>{{$t('CVraf1')}}</q-tooltip>
      </btn-cond>
      <q-toolbar-title class="row justify-between lh1"> 
        <span class="titre-lg">{{$t('cv', [cv.nom])}}</span> 
        <span class="font-mono fs-sm q-ml-md">#{{cv.id}}</span>
      </q-toolbar-title>
      <bouton-help page="cv_aff"/>
    </q-toolbar>

    <div class="row q-pa-sm">
      <img class="col-auto q-mr-sm photomax" :src="cv.photo" />
      <show-html class="col border1" zoom scroll maxh="15rem" :texte="cv.tx"/>
    </div>

  </q-card>
</template>

<script setup>
import stores from '../stores/stores.mjs'
import { GetCv } from '../app/operations4.mjs'
import { styp } from '../app/util.mjs'

import ShowHtml from '../components/ShowHtml.vue'
import BtnCond from '../components/BtnCond.vue'
import BoutonHelp from '../components/BoutonHelp.vue'

const props = defineProps({ 
  cv: Object 
})

const session = stores.session
const ui = stores.ui
const net = session.accesNet

async function refresh () {
  await new GetCv().run(props.cv.id)
}

</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.lh1
  line-height: 1rem
.border1
  border: 1px solid $grey-5
  padding: 3px
  border-radius: 5px
</style>
