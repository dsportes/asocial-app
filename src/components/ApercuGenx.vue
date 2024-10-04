<template>
<div :class="dkli(idx)">
  <div class="q-pa-xs row items-start">
    <div class="col-auto items-center q-mr-sm column">
      <img class="photomax" :src="cv.photo" />
    </div>
    <div class="col">
      <div class="row">
        <div class="col">
          <span class="text-bold titre-lg q-mr-sm">{{cv.nomC}}</span> 
          <span v-if="estAvc" class="fs-md q-mr-sm">[{{$t('moi')}}]</span> 
          <span v-if="del && !estComptable" class="fs-md q-mr-sm">[{{$t('delegue')}}]</span> 
          <span class="fs-sm font-mono q-mr-sm">{{'#' + id}}</span> 
          <span v-if="im" class="fs-sm font-mono q-mr-sm">{{'[' + im + ']'}}</span> 
        </div>
        <div class="col-auto" v-if="!estComptable">
          <btn-cond v-if="estAvc || estAnim" icon="edit" round stop @ok="edcv"/>
          <btn-cond v-else icon="zoom_in" round stop @ok="ovcv"/>
        </div>
      </div>
      <div v-if="cv.texte" class="titre-md">{{titre(cv.texte)}}</div>

      <mc-memo v-if="!estComptable" :id="id" :idx="idx"/>     

      <div class="row">
        <div class="col">
          <div v-if="chats.length" class="row q-gutter-sm">
            <span class="text-italic titre-md">{{$t('CAVtit')}}</span>
            <span v-for="e in chats" :key="e.id" class="fs-md bord">{{e.nom}}</span>
          </div>

          <div v-if="groupes.size" class="row q-gutter-sm">
            <span class="text-italic titre-md">{{$t('CAVmb')}}</span>
            <span v-for="idg in groupes" :key="idg" class="fs-md bord">{{session.getCV(idg).nomC}}</span>
          </div>
        </div>
        <btn-cond class="col-auto self-start" v-if="!nodet && !estAvc && !estGroupe && !det" size="sm"
            icon="open_in_new" :label="$t('detail')" stop @ok="ouvrirdetails"/>
      </div>
    </div>
  </div>
  <!--q-separator color="orange" size="1px"/-->

  <q-dialog v-model="ui.d[idc].ACVouvrir" persistent>
    <apercu-cv :cv="cv"/>
  </q-dialog>

  <!-- Dialogue d'édition de la carte de visite -->
  <carte-visite v-model="ui.d[idc].CVedition2" :cv="cv"/>

</div>
</template>

<script setup>
import { computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { ID } from '../app/api.mjs'
import { dkli, titre } from '../app/util.mjs'
import ApercuCv from '../dialogues/ApercuCv.vue'
import CarteVisite from '../dialogues/CarteVisite.vue'
import BtnCond from './BtnCond.vue'
import McMemo from './McMemo.vue'

import { useI18n } from 'vue-i18n'
const $t = useI18n().t

const props = defineProps({ 
  id: String, // id du groupe, avatar du compte ou contact
  del: Boolean, // true si délégué, pour l'afficher
  im: Number, // pour un membre pour l'afficher
  nodet: Boolean, // true si le panel de détail ne peut PAS être ouvert
  idx: Number
})

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const aSt = stores.avatar
const gSt = stores.groupe
const pSt = stores.people
const session = stores.session

const chats = computed(() => aSt.chatsDuCompte(props.id, true))
const groupes = computed(() => pSt.getSgr(props.id))
const estGroupe = computed(() => ID.estGroupe(props.id))
const estAnim = computed(() => gSt.estAnim(props.id))
const estComptable = computed(() => ID.estComptable(props.id))
const estAvc = computed(() => session.compte.mav.has(props.id))
const cv = computed(() => session.getCV(props.id))
// true si le panel de détail est déjà ouvert
const det = computed(() => session.peopleId === props.id && ui.estOuvert('detailspeople'))
    // Peut être choisi pour devenir contact du groupe courant
const diagC  = computed(() => gSt.diagContact(props.id))

function ovcv () {
  ui.oD('ACVouvrir', idc)
}

function edcv () {
  ui.oD('CVedition2', idc)
}

function ouvrirdetails () {
  session.setPeopleId(props.id)
  ui.oD('detailspeople', 'a')
}

async function select () {
  ui.selectContact(props.id)
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.q-btn
  padding: 1px !important
.b1
  border: 1px solid $yellow-5
.bord
  border: 1px solid $grey-5
  border-radius: 5px
  padding: 0px
</style>
