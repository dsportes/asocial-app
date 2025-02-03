<template>
<div :class="dkli(idx)">
  <div class="q-pa-xs row items-start">
    <div class="col-auto items-center q-mr-sm column">
      <img class="photomax" :src="cv.photo" />
    </div>
    <div class="col">
      <div class="row justify-between items-center">
        <div class="row q-gutter-sm">
          <span class="text-bold titre-lg">{{cv.nom}}</span> 
          <span v-if="estAvc && !affid" class="fs-md">[{{$t('moi')}}]</span> 
          <span v-if="del && !estComptable" class="fs-md">[{{$t('delegue')}}]</span> 
          <span v-if="estGroupe || estPeople || affid" 
            class="fs-sm font-mono">{{'#' + id}}</span> 
        </div>
        <div v-if="estGroupe" class="col-auto row q-gutter-xs">
          <btn-cond v-if="estAnim" icon="badge" round stop @ok="edcv"/>
          <btn-cond v-else icon="badge" round stop @ok="ovcv"/>
        </div>
        <div v-else>
          <div class="col-auto row q-gutter-xs" v-if="!estComptable">
            <btn-cond v-if="estAvc" icon="badge" round stop @ok="edcv"/>
            <btn-cond v-if="!estAvc && estPeople" icon="badge" round stop @ok="ovcv"/>
            <!--btn-cond v-if="estPeople && !nodetP && !detPeople" round icon="zoom_in" 
              stop @ok="ouvrirdetails"/-->
          </div>
        </div>
      </div>
      <div v-if="(estGroupe || estPeople) && cv.texte" class="titre-md">{{titre(cv.texte)}}</div>

      <mc-memo v-if="!estComptable" :id="id" :idx="idx"/>
    </div>
  </div>

  <q-expansion-item v-if="!estGroupe && !nochgr" header-class="tbs"
    switch-toggle-side expand-separator dense :label="$t('CAchmb', [sch.size, sgr.size])">
    <div class="col">
      <chats-avec :idE="id" :del="del" class="q-mt-sm" :urgence="urgence"/>

      <div v-if="sgr.size" class="row items-center q-gutter-sm q-mt-sm">
        <div class="text-italic titre-md text-bold">{{$t('CAVmb')}}</div>
        <div v-for="idg in sgr" :key="idg" class="fs-md bord">
          <span>{{session.getCV(idg).nomC}} - {{$t('AMm' + stmb(idg))}}</span>
          <btn-cond class="q-ml-md" icon="open_in_new" @ok="voirgr(idg)"/>
        </div>
      </div>
    </div>
  </q-expansion-item>

  <q-dialog v-model="ui.d[idc].ACVouvrir" persistent>
    <apercu-cv :cv="cv"/>
  </q-dialog>

  <!-- Dialogue d'édition de la carte de visite -->
  <q-dialog v-model="ui.d[idc].CVedition" persistent>
    <carte-visite :cv="cv"/>
  </q-dialog>

</div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { ID } from '../app/api.mjs'
import { dkli, titre } from '../app/util.mjs'
import ApercuCv from '../dialogues/ApercuCv.vue'
import ChatsAvec from './ChatsAvec.vue'
import CarteVisite from '../dialogues/CarteVisite.vue'
import BtnCond from './BtnCond.vue'
import McMemo from './McMemo.vue'
import { GetCv } from '../app/operations4.mjs'

import { useI18n } from 'vue-i18n'
const $t = useI18n().t

const props = defineProps({ 
  id: String, // id du groupe, avatar du compte ou contact
  del: Boolean, // true si délégué, pour l'afficher
  nochgr: Boolean, // true ne pas afficher chats et groupes
  idx: Number,
  urgence: Boolean, // true si invoqué depuis tab URGENCE
  affid: Boolean
})

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const aSt = stores.avatar
const gSt = stores.groupe
const pSt = stores.people
const session = stores.session

const sch = computed(() => pSt.getSch(props.id))
const sgr = computed(() => pSt.getSgr(props.id))

const gr = (idg) => { const e = gSt.egr(idg); return e ? e.groupe : null }
const imx = (idg) => { const g = gr(idg); return g ? g.mmb.get(props.id) : 0 }
const stmb = (idg) => { const i = imx(idg); return i ? gr(idg).st[i] : 0 }

const estGroupe = computed(() => ID.estGroupe(props.id))
const estAnim = computed(() => gSt.estAnim(props.id))
const estComptable = computed(() => ID.estComptable(props.id))
const estAvc = computed(() => session.compte.mav.has(props.id))
const cv = computed(() => session.getCV(props.id))
// true si le panel de détail est déjà ouvert
// const det = computed(() => session.peopleId === props.id && ui.estOuvert('detailspeople'))
// Peut être choisi pour devenir contact du groupe courant
const diagC = computed(() => gSt.diagContact(props.id))
const estPeople = computed(() => pSt.estPeople(props.id))

// const detPeople = computed(() => ui.estOuvert('detailspeople'))

if (props.del && !estComptable.value && !estPeople.value) onMounted(async () => {
  const cv = await new GetCv().run(props.id)
  if (cv) pSt.setPeopleDelegue(cv)
})

function voirgr (idg) {
  session.setGroupeId(idg)
  ui.fD()
  ui.setPage('groupe', 'membres')
}

function ovcv () {
  ui.oD('ACVouvrir', idc)
}

function edcv () {
  ui.oD('CVedition', idc)
}

/*
function ouvrirdetails () {
  session.setPeopleId(props.id)
  ui.oD('detailspeople', 'a')
}
*/

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
