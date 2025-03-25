<template>
<div class="q-pa-sm q-my-sm">
  <q-expansion-item  :label="$t('ICti1')" class="q-my-xs q-mx-xs"
    header-class="tbp titre-md"
    switch-toggle-side  dense group="trgroup">
    <apercu-genx :id="inv.idg" :idx="0"/>
    <q-separator class="q-my-xs" color="orange"/>
    <apercu-genx :id="inv.ida" :idx="1"/>
  </q-expansion-item>

  <q-expansion-item  :label="$t('ICti2')" class="q-my-xs q-mx-xs"
    header-class="tbp titre-md"
    switch-toggle-side  dense group="trgroup">
    <div class="titre-lg">{{$t('AMinvvp')}}</div>
    <apercu-genx class="q-my-xs" v-for="(id, idx) in inv.invpar" :key="id" :id="id" :idx="idx"/>
  </q-expansion-item>

  <q-expansion-item  v-model="expanded" :label="$t('ICti3')" class="q-my-xs q-mx-xs"
    header-class="tbp titre-md"
    switch-toggle-side  dense group="trgroup">

    <div class="spsm q-my-md">
      <div class="titre-md q-mb-sm">{{$t('ICbienv')}}</div>
      <show-html class="bord1" :texte="inv.msg" maxh="4rem" scroll zoom/>
    </div>

    <droits-membre v-model="drMb" :id="props.inv.ida" :idg="props.inv.idg"/>
  </q-expansion-item>

  <div class="q-my-md spsm row justify-end items-center q-gutter-md">
    <btn-cond flat :label="$t('renoncer')" icon="undo" @ok="ui.fD"/>
    <btn-cond :label="$t('ICacc')" icon="check" cond="cEdit" @ok="accref(1)"/>
    <btn-cond :label="$t('ICdec')" icon="close" color="warning" cond="cEdit" @ok="accref(2)"/>
  </div>

  <div v-if="acc === 1" class="spsm q-my-sm">

    <div class="q-mt-md q-mb-xs titre-md text-italic">{{$t('ICrem1')}}</div>
    <editeur-md :lgmax="1000" v-model="msg" :texte="defmsg" modetxt mh="8rem" editable />

    <div class="q-mt-sm row justify-end items-center q-gutter-md">
      <btn-cond flat :label="$t('renoncer')" icon="undo" @ok="ui.fD"/>
      <btn-cond class="q-ml-md" color="warning" icon="check" :disable="!msg"
        :label="$t('confirmer')" @ok="ok(1)"/>
    </div>
  </div>

  <div v-if="acc === 2" class="spsm q-my-sm">
    <div class="bord1 column justify-left">
      <span><q-radio v-model="decl" dense :val="2" :label="$t('ICd2')"/><bouton-bulle class="q-ml-md" idtext="BULLEinv2"/></span>
      <span><q-radio v-model="decl" dense :val="3" :label="$t('ICd3')" /><bouton-bulle class="q-ml-md" idtext="BULLEinv3"/></span>
      <span><q-radio v-model="decl" dense :val="4" :label="$t('ICd4')" /><bouton-bulle class="q-ml-md" idtext="BULLEinv4"/></span>
    </div>

    <div class="q-mt-md q-mb-xs titre-md text-italic">{{$t('ICrem2')}}</div>
    <editeur-md :lgmax="1000" v-model="msg" :texte="defmsg" modetxt mh="8rem" editable />

    <div class="q-mt-sm row justify-end items-center q-gutter-md">
      <btn-cond flat :label="$t('renoncer')" icon="undo" @ok="ui.fD"/>
      <btn-cond class="q-ml-md" color="warning" :disable="!decl || !msg"
        :label="$t('confirmer')" icon="close" @ok="ok(decl)"/>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed } from 'vue'

import stores from '../stores/stores.mjs'

import EditeurMd from './EditeurMd.vue'
import BoutonHelp from './BoutonHelp.vue'
import BoutonBulle from './BoutonBulle.vue'
import ApercuGenx from './ApercuGenx.vue'
import BtnCond from './BtnCond.vue'
import ShowHtml from './ShowHtml.vue'
import DroitsMembre from './DroitsMembre.vue'

import { AcceptInvitation } from '../app/operations4.mjs'
import { afficher8000, $t } from '../app/util.mjs'
import { FLAGS } from '../app/api.mjs'

const session = stores.session
const ui = stores.ui
const expanded = ref(true)

const props = defineProps({ 
  inv: Object // { idg, ida, flags, invpar: Set(id invitant), msg }
})

const defmsg = ref($t('merci'))
const msg = ref(defmsg.value)
const cfln = ref(0)
const decl = ref(0)
const acc = ref(0)

const nomm = computed(() => session.getCV(props.inv.ida).nom )
const nomg = computed(() => session.getCV(props.inv.idg).nom )
const fl = computed(() => {
  let fl = props.inv.flags
  fl |= FLAGS.AN
  fl |= FLAGS.AM
  return fl
})
const edFlags = computed(() => { 
  const f = props.inv.flags
  if (!f) return ''
  const ed = []
  if (f & FLAGS.AN) ed.push($t('AMinvan'))
  if (f & FLAGS.DM) ed.push($t('AMinvdm'))
  if (f & FLAGS.DE) ed.push($t('AMinvde'))
  else if (f & FLAGS.DN) ed.push($t('AMinvdn'))
  return ed.join(', ')
})

const drMb = ref({ fl: fl.value, anim: (props.inv.flags & FLAGS.AN) !== 0})

const accref = (x) => acc.value = x
    
async function ok (cas) {
  const fl = drMb.value.fl
  const iam = (fl & FLAGS.AM) !== 0
  const ian = (fl & FLAGS.AN) !== 0
  const r = await new AcceptInvitation().run(cas, props.inv, iam, ian, msg.value)
  if (r) await afficher8000(r, props.inv.ida, props.inv.idg)
  ui.fD()
}

</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 1px solid $grey-5
  border-radius: 5px
  padding: 3px
</style>
