<template>
<div class="spsm column bord">
  <q-toolbar class="tbs full-width">
    <q-toolbar-title class="titre-md text-center q-mx-sm">{{$t('DMtit', [nomm, nomg])}}</q-toolbar-title>
    <btn-cond icon="undo" @ok="undo" :disable="!anChg && !flChg"/>
    <bouton-help page="dial_droits"/>
  </q-toolbar>

  <div class="full-width q-pa-sm fs-md">
    <div v-if="!pcAnim" class="q-mt-sm row q-gutter-sm">
      <q-icon name="info" size="sm" color="primary" class="col-auto"/>
      <div class="col">{{$t('DMpcAnim')}}</div>
    </div>
    <div v-if="!pcID" class="q-mt-sm row q-gutter-sm">
      <q-icon name="info" size="sm" color="primary" class="col-auto"/>
      <div class="col">{{$t('DMpcID')}}</div>
    </div>
    <div v-if="!pcIA && gr" class="q-mt-sm row q-gutter-sm">
      <q-icon name="info" size="sm" color="primary" class="col-auto"/>
      <div class="col">{{$t('DMpcIA')}}</div>
    </div>

    <q-separator v-if="!pcAnim || !pcID || !pcIA" color="orange" class="q-my-sm"/>

    <div class="q-mt-md full-width text-italic fs-md">{{$t('DMdroits')}}</div>
    <div class="row full-width text-italic fs-md">
      <div class="col-1 text-bold fs-lg q-pl-xs">↓</div>
      <div class="col-11">{{$t('DMaccepts')}}</div>
    </div>
    <div class="row full-width text-italic fs-md">
      <div class="col-1 text-bold fs-lg q-pl-xs">↓</div>
      <div class="col-1 text-bold fs-lg q-pl-xs">↓</div>
      <div class="col-10">{{$t('DMapplic')}}</div>
    </div>
    <div class="row full-width text-italic fs-md">
      <div class="col-1 text-bold fs-lg q-pl-xs">↓</div>
      <div class="col-1 text-bold fs-lg q-pl-xs">↓</div>
      <div class="col-1 text-bold fs-lg q-pl-xs">↓</div>
      <div class="col-9"></div>
    </div>

    <div class="row full-width fs-md">
      <q-checkbox class="col-1" dense
        v-model="anim" color="primary" :disable="!pcAnim"/>
      <div class="col-1"></div>
      <q-checkbox class="col-1" dense 
        v-model="anim" color="positive" disable/>
      <div class="col-9">{{$t('DMdanim')}}</div>
    </div>

    <div class="row full-width fs-md">
      <q-checkbox class="col-1" dense
        v-model="idm" color="primary" :disable="!pcID"/>
      <q-checkbox v-if="estActifInv || !gr" class="col-1" dense
        v-model="iam" color="accent" :disable="!pcIA"/>
      <div v-else class="col-1"></div>
      <q-checkbox class="col-1" dense 
        v-model="aAM" color="positive" disable/>
      <div class="col-9">{{$t('DMdam')}}</div>
    </div>

    <div class="row full-width fs-md">
      <q-checkbox class="col-1" dense
        v-model="idn" color="primary" :disable="!pcID"/>
      <q-checkbox v-if="estActifInv || !gr" class="col-1" dense
        v-model="ian" color="accent" :disable="!pcIA"/>
      <div v-else class="col-1"></div>
      <q-checkbox class="col-1" dense 
        v-model="aAN" color="positive" disable/>
      <div class="col-9">{{$t('DMdln')}}</div>
    </div>

    <div class="row full-width fs-md">
      <q-checkbox class="col-1" dense
        v-model="ide" color="primary" :disable="!pcID"/>
      <div class="col-1"></div>
      <q-checkbox class="col-1" dense 
        v-model="aAE" color="positive" disable/>
      <div class="col-9">{{$t('DMden')}}</div>
    </div>

    <div v-if="gr">
      <div v-if="nbAnimsAp" :class="'titre-md text-italic q-my-sm ' + (nbAnimsAp !== nbAnimsAv ? 'msg' : '') ">
        {{$t('AMnbanim', [nbAnimsAp])}}
      </div>
      <div v-if="!nbAnimsAp && !nbAnimsAv" class="titre-md text-italic q-my-sm">{{$t('AMnbanim1')}}</div>
      <div v-if="!nbAnimsAp && nbAnimsAv" class="msg titre-lg q-my-sm">{{$t('AMnbanim2')}}</div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

import { $t } from 'src/app/util.mjs'
import { FLAGS } from '../app/api.mjs'
import stores from '../stores/stores.mjs'
import BoutonHelp from './BoutonHelp.vue'
import BtnCond from './BtnCond.vue'

const session = stores.session
const gSt = stores.groupe

const props = defineProps({ 
  id: String, // id de l'avatar membre
  idg: String // depuis une invitation, id du groupe
})

const model = defineModel({ 
  type: Object // { fl:Number, anim:true/false }
})

const im = computed(() => gSt.egrC && gSt.egrC.groupe ? gSt.egrC.groupe.mmb.get(props.id) : 0)
const gr = computed(() => gSt.egrC ? gSt.egrC.groupe : null)
const nomg = computed(() => session.getCV(gr.value ? gr.value.id : props.idg).nom)
const nomm = computed(() => session.getCV(props.id).nomC)
const moi = computed(() => session.estAvc(props.id))

const stm = computed(() => gr.value ? gr.value.st[im.value] : 1)
const estActifInv = computed(() => stm.value >= 3)
// L'avatar COURANT du compte est "animateur"
const mbAnim = computed(() => stm.value >= 4 && gr.value.estAnim(gr.value.mmb.get(session.avatarId)))
const cptAnim = computed(() => gr.value ? gSt.egrC.estAnim : false)

const anim = ref(model.value.anim)
const anAvant = ref(model.value.anim || false)
const anChg = computed(() => anAvant.value !== anim.value)
watch(anim, (ap) => { if (ap !== model.value.anim) model.value.anim = ap })

const ina = ref()
const idm = ref() 
const idn = ref() 
const ide = ref() 
const iam = ref() 
const ian = ref()

const aAM = computed(() => idm.value && iam.value)
const aAN = computed(() => idn.value && ian.value)
const aAE = computed(() => ide.value && ian.value)

const nvfl = computed(() =>{ 
  let fl = 0
  if (iam.value) fl |= FLAGS.AM
  if (ian.value) fl |= FLAGS.AN
  if (idm.value) fl |= FLAGS.DM 
  if (idn.value) fl |= FLAGS.DN
  if (ide.value) fl |= FLAGS.DE 
  return fl
})

function setFl (fl) {
  ina.value = (fl & FLAGS.AN) !== 0
  idm.value = (fl & FLAGS.DM) !== 0 
  idn.value = (fl & FLAGS.DN) !== 0 
  ide.value = (fl & FLAGS.DE) !== 0 
  iam.value = (fl & FLAGS.AM) !== 0 
  ian.value = (fl & FLAGS.AN) !== 0
}

// valeur initale du flag 
setFl(model.value.fl)
const flAvant = ref(nvfl.value)
const flChg = computed(() => flAvant.value !== nvfl.value)

const nbAnimsAv = computed(() => gr.value ? gr.value.nbAnims : 0)
const nbAnimsAp = computed(() => { 
  const anav = stm.value === 5 ? true : false
  if (model.value.anim && !anav) return nbAnimsAv.value + 1
  if (!model.value.anim && anav) return nbAnimsAv.value - 1
  return nbAnimsAv.value
})

// Peut changer anim: compte animateur et membre pas animateur
const pcAnim = computed(() => cptAnim.value && (!mbAnim.value || moi))

// Peut changer idm/idn/ide: compte animateur et membre pas animateur OU moi
const pcID = computed(() => cptAnim.value && (!mbAnim.value || moi.value))

// Peut changer iam/ian: moi si actif
const pcIA = computed(() => (moi.value && estActifInv.value) || !gr.value )

watch(anim, (ap) => { // Un animateur A TOUJOURS accès aux membres
  if (ap) idm.value = true
  model.value.fl = nvfl.value 
})

watch(idm, (ap) => { model.value.fl = nvfl.value })

watch(idn, (ap) => { // Pas d'accès AN -> pas d'accès DE
  if (!ap) ide.value = false
  model.value.fl = nvfl.value 
})

watch(ide, (ap) => { 
  if (ap) idn.value = true
  model.value.fl = nvfl.value 
})

watch(iam, (ap) => { model.value.fl = nvfl.value })

watch(ian, (ap) => { model.value.fl = nvfl.value })

function undo () { 
  setFl(flAvant.value)
  anim.value = anAvant.value
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border: 1px solid var(--q-secondary)
  border-radius: 5px
</style>