<template>
  <div class="titre-md">
    <q-btn-dropdown no-caps dense :color="naAut ? 'primary' : 'warning'"
      :label="naAut ? $t('PNOaut1' + (fic || ''), [naAut.nom]) : $t('PNOaut' + (g ? '2' : '3'))" 
      content-style="width:25rem!important">
      <q-list class="bg-secondary text-white q-py-xs">
        <q-item v-for="e in la" :key="e.id" 
          :clickable="!e.ko"
          v-close-popup @click="selAut(e)"
          class="row items-start full-width">
            <div class="fs-md col-4">{{e.nom}}</div>
            <div class="col-8 titre-md" 
              :class="e.ko ? 'text-warning bg-yellow-5 fs-sm text-bold' : ''">
              {{!e.ko ? $t('ok') : $t('PNOecrko' + e.ko)}}
            </div>
        </q-item>
      </q-list>
    </q-btn-dropdown>
  </div>
</template>

<script setup>
import { ref } from 'vue'

import stores from '../stores/stores.mjs'

const props = defineProps({ 
  groupe: Object, // groupe de la note (édition ET nouvelle)
  note: Object, // Pour édition d'une note existante seulement
  fic: String, // a/m Modif de label pour "ajout" / "modif" de fichier
  optmb: Boolean // ne liste que les avc ayant droit d'accès aux membres du groupe
})

const session = stores.session
const gSt = stores.groupe
const nSt = stores.note
/* {nom, i, im, id, ko} ko: 1 pas auteur, 2: n'a pas exclusiité (edition seulement) */
const la = ref([])

const g = ref()
if (props.note) {
  const e = gSt.egr(props.note.id)
  g.value = e ? e.groupe : null
} else g.value = props.groupe

const naAut = ref()

const emit = defineEmits(['ok'])

function selAut(elt) {
  naAut.value = elt
  emit('ok', elt)
}

const auts = nSt.note ? nSt.note.l || [] : []
const l = []
let ok = false
const sav = session.compte.mpg.get(g.value.id)
if (sav && g.value) for (const id of sav) {
  const im = g.value.mmb.get(id)
  if (!im) continue
  let i = auts.indexOf(im)
  i = i === -1 ? 99999 : i
  const x = { nom: session.getCV(id).nom, i, ko: 0, im, id }
  if (props.optmb) {
    const m = g.value.accesMembre(im)
    if (!m) x.ko = 3; else ok = true
  } else {
    const a = g.value.estAuteur(im)
    if (!a) {
      x.ko = 1
    } else {
      if (props.note && props.note.im && props.note.im !== im && !g.value.estAnim(im)) x.ko = 2
      else ok = true
    }
  }
  l.push(x)
}
l.sort((a,b) => { return a.ko ? (b.ko ? 0 : 1) : (!b.ko ? (a.i < b.i ? -1 : 1) : 1)})
la.value = l
selAut(ok ? l[0] : null)

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.w25
  min-width: 25rem !important
</style>
