<template>
  <div>
    <div :class="dkli(idx + 1) + ' mcm'">
      <div v-if="!ui.etroite" class="row full-width items-center">
        <div class="col-6 fs-sm z1">
          <span v-if="memolg">{{memolg}}</span>
          <span v-else class="text-italic">{{$t('MMCnomemo')}}</span>
        </div>
        <div class="col">
          <div v-if="apropos.ht.size" class="font-mono fs-sm z1">{{s2Str(apropos.ht)}}</div>
          <div v-else class="text-italic fs-sm z1">{{$t('MMCnomc')}}</div>
        </div>
        <btn-cond class="col-auto text-right" round icon="zoom_in" @ok="zoom"/>
      </div>

      <div v-else class="column full-width">
        <div class="row items-center justify-between">
          <div v-if="memolg" class="text-italic fs-sm z1">{{memolg}}</div>
          <div v-else class="text-italic">{{$t('MMCnomemo')}}</div>
          <btn-cond class="col-auto text-right" round icon="zoom_in" @ok="zoom"/>
        </div>
        <div v-if="apropos.ht.size" class="font-mono fs-md z1">{{s2Str(apropos.ht)}}</div>
        <div v-else class="text-italic fs-sm z1">{{$t('MMCnomc')}}</div>
      </div>
    </div>

    <q-dialog v-model="ui.d[idc].MMedition">
      <q-card :class="styp('md')">
        <q-toolbar class="col-auto bg-secondary text-white">
          <btn-cond icon="close" color="warning" @ok="ui.fD"/>
          <q-toolbar-title>{{$t('MMCap', [nom])}}</q-toolbar-title>
          <bouton-help page="htcomm_maj"/>
        </q-toolbar>
        <q-toolbar inset v-if="diag" class='q-ma-sm bg-yellow-5 text-warning text-bold'>
          {{$t('MMCnomaj', [diag])}}
        </q-toolbar>

        <q-card-section class="q-py-sm">
          <hash-tags v-model="nvht" :src="apropos.ht"/>
        </q-card-section>

        <q-card-section class="q-py-sm">
          <div class="titre-md">{{$t('MMCcom')}}</div>
          <editeur-md mh="10rem" v-model="nvtx" :texte="apropos.tx" :idx="0"
           :editable="!diag" modetxt/>
        </q-card-section>

        <q-card-actions v-if="!diag" align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond class="q-ml-md" icon="check" cond="cEdit" :disable="!chg"
            :label="$t('valider')" @ok="valider"/>
        </q-card-actions>

      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'

import stores from '../stores/stores.mjs'
import EditeurMd from './EditeurMd.vue'
import BtnCond from './BtnCond.vue'
import BoutonHelp from './BoutonHelp.vue'
import HashTags from './HashTags.vue'
import { styp, dkli, titre } from '../app/util.mjs'
import { McMemo } from '../app/operations4.mjs'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const aSt = stores.avatar
const session = stores.session

const props = defineProps({ 
  id: String, 
  idx: Number
})

const diag = ref('')
const nvht = ref(null)
const nvtx = ref('')

const apropos = computed(() => session.compti.mc.get(props.id) || { ht: new Set(), tx: ''} )
const memolg = computed(() => titre(apropos.value.tx))
const nom = computed(() => session.getCV(props.id).nom)
const chg = computed(() => apropos.value.tx !== nvtx.value || s2Str(apropos.value.ht) !== s2Str(nvht.value))

const s2Str = (s) => Array.from(s).sort().join(' ')

function zoom () { 
  diag.value = session.cEdit
  nvht.value = apropos.value.ht || new Set()
  nvtx.value = apropos.value.tx || ''
  ui.oD('MMedition', idc)
}

async function valider () {
  await new McMemo().run(props.id, s2Str(nvht.value), nvtx.value)
  ui.fD()
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.btn
  min-height: 1.1rem !important
  max-height: 1.1rem !important
  min-width: 1.1rem !important
  max-width: 1.1rem !important
.z1
  max-height: 1.2rem
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap
.mcm
  border-radius: 10px
  padding: 0 0 0 5px
  margin: 2px 0
</style>
