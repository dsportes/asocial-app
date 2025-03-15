<template>
  <q-layout container view="hHh lpR fFf" :class="styp('lg')">
    <q-header elevated>
      <q-toolbar class="tbs">
        <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
        <q-toolbar-title class="titre-md q-mx-sm">
          {{note.titre}}
        </q-toolbar-title>
        <bouton-help page="album_photos"/>
       </q-toolbar>
      <q-toolbar inset class="tbs">
        <q-toolbar-title class="row q-gutter-sm fs-md">
          <span class="font-mono text-bold">{{fic.nom}}</span>
          <span v-if="fic.info" class="font-mono text-italic">{{fic.info}}</span>
          <span class="font-mono">{{dhcool(fic.dh, true)}}</span>
        </q-toolbar-title>
        <btn-cond icon="image" :label="$t('APzoom')" @ok="zoom"/>
        <btn-cond class="q-ml-xs" icon="description" :label="$t('APnote')" @ok="select"/>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-card class="q-pa-sm row justify-center">
        <div v-for="e in lstPhotos" :key="e.idf">
          <img :class="'cursor-pointer ' + (e.idf === elt.idf ? 'selImg' : 'nselImg')"
            :src="e.fic.thn" @click="sel(e)"/>
        </div>
      </q-card>
    </q-page-container>

      <!-- Zoom d'une photo -->
    <q-dialog v-model="ui.d[idc].Zimg" maximized
        transition-show="slide-left"
        transition-hide="slide-right">
      <zoom-photo :fic="fic" :note="note"/>
    </q-dialog>

  </q-layout>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import ZoomPhoto from '../components/ZoomPhoto.vue'
import BtnCond from '../components/BtnCond.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import { styp, dhcool } from '../app/util.mjs'

const ui = stores.ui
const idc = ui.getIdc() ; onUnmounted(() => ui.closeVue(idc))
const nSt = stores.note

const props = defineProps({
  lstPhotos: Array
})

const emit = defineEmits(['select']) // emit('select', nodeId)

const elt = ref(props.lstPhotos[0])
const note = computed(() => elt.value.node.note )
const fic = computed(() => elt.value.fic )

function sel (e) { elt.value = e }

function zoom () {
  ui.oD('Zimg', idc)
}

function select () {
  nSt.presel = elt.value.node.note.ids
  emit('select', elt.value.node)
  ui.fD()
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.selImg
  border: 2px solid $warning
  margin: 2px
.nselImg
  border: 1px solid $grey-5
  margin: 3px
</style>