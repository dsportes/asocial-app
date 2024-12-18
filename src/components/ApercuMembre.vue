<!--
ApercuMembre est un sous-composant de PageGroupe:
- dans l'onglet groupe, un item par avatar du COMPTE inscrit dans le groupe
  - le "membre" mb est diponible SSI un des avatars du compte est
    actif avec accès aux membres.
  - mb n'est pas disponible dans le cas contraire.
- dans l'onglet membres, un item par memebre du groupe SAUF ceux du compte.
  - le membre mb est toujours disponible (sinon l'onglet ne s'est pas affiché)
Les actions réservées aux ANIMATEURS s'appliquent si l'auteur de l'action
a accès aux membres (donc dans l'onglet "membres").
  - toutefois elles peuvent s'appliquer aux avatars du groupe (onglet groupe)
  à condition qu'au moins un avatar du groupe soit ANIMATEUR, même sans accès aux membres.
-->
<template>
<div>
  <q-expansion-item :class="dkli(idx)" v-model="ouvert"
    switch-toggle-side expand-separator dense group="trgroup">
    <template v-slot:header>
      <div class="column full-width">
        <apercu-genx :id="id" :im="im" :idx="idx"/>
        <div class="row titre-md items-center">
          <span class="stx">{{$t('AMm' + stm)}}</span>
          <span v-if="gr.imh === im" class="stx">{{$t('AMmh')}}</span>
          <span v-if="im === 1" class="stx">{{$t('AMmf')}}</span>
          <span v-if="amb" class="stx">{{$t('AMmm')}}</span>
          <span v-if="ano" class="stx">{{$t('AMn' + ano)}}</span>
          <span v-if="gr.enLNG(id)" class="stx2">{{$t('AMlng')}}</span>
          <span v-if="gr.enLNC(id)" class="stx2">{{$t('AMlnc')}}</span>
          <bouton-bulle2 :texte="edit(fl, $t, '\n')"/>
        </div>

        <div class="q-mt-xs row q-gutter-xs">
          <btn-cond v-if="condm.has(1)" icon="grade" cond="cEdit" size="sm" stop
            :label="$t('AMinvitbtn1')" @ok="ouvririnvit"/>
          <btn-cond v-if="condm.has(2)" icon="check" cond="cEdit" size="sm" stop
            :label="$t('AMinvitbtn2')" @ok="ui.oD('IAaccinvit', idc)"/>
          <btn-cond v-if="condm.has(3)" icon="check" cond="cEdit" size="sm" stop
            :label="$t('AMinvitbtn3')" @ok="gererDroits"/>
          <btn-cond v-if="condm.has(4)" icon="close" cond="cEdit" size="sm" stop
            :label="$t('AMinvitbtn4')" @ok="radiation"/>
        </div>
      </div>
    </template>

    <div class="q-ml-xl">
      <div v-if="!mb" class="titre-md">
        <div class="row">
          <div class="text-italic col-6">{{$t('AMmembres')}}</div>
          <div class="col-6">{{$t('etre', gr.accesMembreH(im))}}</div>
        </div>
        <div class="row">
          <div class="text-italic col-6">{{$t('AMlecture')}}</div>
          <div class="col-6">{{$t('etre', gr.accesLecNoteH(im))}}</div>
        </div>
        <div class="row">
          <div class="text-italic col-6">{{$t('AMecriture')}}</div>
          <div class="col-6">{{$t('etre', gr.accesEcrNoteH(im))}}</div>
        </div>

      </div>

      <div v-else>
        <div v-if="mb.dpc" class="row">
          <div class="text-italic col-6">{{$t('AMdpc')}}</div>
          <div class="font-mono text-bold">{{xd(mb.dpc)}}</div>
        </div>
        <div class="row">
          <div class="text-italic col-6">{{$t('AMddi')}}</div>
          <div v-if="mb.ddi" class="font-mono text-bold">{{xd(mb.ddi)}}</div>
          <div v-else class="font-mono text-bold">{{$t('AMinv0')}}</div>
        </div>
        <div class="row">
          <div class="text-italic col-6">{{$t('AMactif')}}</div>
          <div class="col-6">{{edd([mb.dac, mb.fac])}}</div>
        </div>
        <div class="row">
          <div class="text-italic col-6">{{$t('AMmembres')}}</div>
          <div class="col-6">{{edd([mb.dam, mb.fam])}}</div>
        </div>
        <div class="row">
          <div class="text-italic col-6">{{$t('AMlecture')}}</div>
          <div class="col-6">{{edd([mb.dln, mb.fln])}}</div>
        </div>
        <div class="row">
          <div class="text-italic col-6">{{$t('AMecriture')}}</div>
          <div v-if="mb" class="col-6">{{edd([mb.den, mb.fen])}}</div>
          <div v-else class="col-6">{{$t('etre', eg.groupe.accesEcrNoteH(im))}}</div>
        </div>
      </div>

      <div v-if="stm === 2 || stm === 3">
        <div class="q-my-xs">
          <div class="text-italic">
            <span>{{$t('AMinvit' + stm)}}</span>
            <span v-if="invits.fl & FLAGS.AN" class="q-ml-sm">- {{$t('AMinvan')}}</span>
            <span v-if="invits.fl & FLAGS.DM" class="q-ml-sm">- {{$t('AMinvam')}}</span>
            <span v-if="(invits.fl & FLAGS.DN) && !(invits.fl & FLAGS.DE)" class="q-ml-sm">- {{$t('AMinvln')}}</span>
            <span v-if="invits.fl & FLAGS.DE" class="q-ml-sm">- {{$t('AMinven')}}</span>
          </div>
          <div class="titre-md text-italic q-mt-xs">{{$t('AMbienv')}}</div>
          <show-html class="bord2" v-if="mb" :idx="idx" :texte="mb.msg" maxh="4rem" scroll zoom/>

          <div class="fs-md">
            <span class="text-italic">{{$t('AMinvvp')}}</span>
            <span class="q-ml-sm" v-for="[id, cv] of animInv[0]" :key="id">{{cv.nomC}}</span>
          </div>
          <div v-if="animInv[1].size" class="fs-md">
            <span class="text-italic">{{$t('AMinvvc')}}</span>
            <span class="q-ml-sm" v-for="[id, cv] of animInv[1]" :key="id">{{cv.nomC}}</span>
          </div>
        </div>
      </div>
    </div>
  </q-expansion-item>

  <!-- Dialogue d'invitation -->
  <dial-std2 v-model="m1" :titre="$t('AMinvtit', [nomm, nomg])" help="dial_invit">
    <div v-if="!estAnim" class="column items-center q-gutter-sm">
      <div class="titre-md text-center msg">{{$t('AGupasan')}}</div>
      <sel-avidgr :groupe="gr" anim/>
      <btn-cond :label="$t('jailu')" @ok="ui.fD"/>
    </div>
    <div v-else class="row items-center q-gutter-sm">
      <div class="titre-md">{{$t('AGchan')}}</div>
      <sel-avidgr :groupe="gr" anim/>
    
      <q-card-section>
        <div class="row justify betwwen items-end">
          <span class="titre-lg">{{$t('AMcas' + stm)}}</span>
          <span v-if="stm > 1" class="titre-md q-ml-md">[ {{edFlagsiv}} ]</span>
        </div>
        <div v-if="gr.msu">
          <div v-if="stm > 1" class="fs-md">
            <span class="text-italic">{{$t('AMinvvp')}}</span>
            <span class="q-ml-sm" v-for="[id, cv] of animInv[0]" :key="id">{{cv.nomC}}</span>
          </div>
          <div v-if="stm === 2" class="fs-md">
            <span class="text-italic">{{$t('AMinvvc')}}</span>
            <span class="q-ml-sm" v-for="[id, cv] of animInv[1]" :key="id">{{cv.nomC}}</span>
          </div>
        </div>
        <div v-else>
          <div v-if="stm === 2">{{$t('AMinvpar', [invpar])}}</div>
        </div>
        <div v-if="stm > 1" class="titre-md text-italic">{{$t('AMbienv')}}</div>
        <show-html class="bord1" v-if="stm > 1" :texte="mb.msg" :idx="0" maxh="4rem" zoom/>
        <div v-if="stm > 1" class="bordm">
            <q-option-group dense v-model="rmsv" :options="optRMSV" color="primary" />
        </div>
      </q-card-section>

      <q-card-section v-if="stm === 1 || rmsv === 2" class="q-ma-sm">
        <!-- Edition / création d'une invitation -->
        <div v-if="!gr.msu">
          <div v-if="optAvAnims.length === 1">{{$t('AMinvpar2', [invparf.label])}}</div>
          <div v-else class="row items-center">
            <span class="q-mr-md">{{$t('AMchinv')}}</span>
            <q-select v-model="invparf" borderless dense options-dense standard filled
              :options="optAvAnims" style="min-width:120px;max-width:120px"
              popup-content-class="bg-accent text-white titre-md text-bold q-pa-sm"/>
          </div>
        </div>

        <div class="bord2 column q-pa-xs q-mb-sm titre-md">
          <q-checkbox dense v-model="ina" :label="$t('AManimateur')" />
          <q-checkbox dense v-model="idm" :label="$t('AMmembres')" />
          <q-checkbox dense v-model="idn" :label="$t('AMlecture')" />
          <q-checkbox dense v-if="idn" v-model="ide" :label="$t('AMecriture')" />
        </div>

        <div class="stx fs-md" v-if="nvfl !== invits.fl && stm === 2">{{$t('AMchg')}}</div>

        <div class="q-mt-md titre-md text-italic">{{$t('AMbienv')}}</div>
        <editeur-md class="q-mb-sm bord1" :lgmax="1000" v-model="msg" :texte="msg"
          modetxt mh="8rem" editable/>
      </q-card-section>

      <q-card-section v-if="rmsv === 3" class="q-ma-sm">
        <!-- Suppression d'une invitation -->
        <q-option-group dense v-model="suppr" :options="optSuppr" color="primary" />
      </q-card-section>

      <q-card-actions align="right" class="q-gutter-xs">
        <btn-cond flat size="md" icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
        <btn-cond v-if="rmsv !== 1" color="warning" icon="check"
          :label="$t('AMconf' + rmsv)"
          :disable="(rmsv === 0 || rmsv === 2) && (!nvfl || !msg)"
          @ok="inviter"/>
      </q-card-actions>
    </div>
  </dial-std2>

<!--
  <q-dialog v-model="ui.d[idc].AMinvit" persistent full-height position="left">
    <q-layout container view="hHh lpR fFf" :class="styp('md')">
      <q-header elevated>
        <q-toolbar class="tbs">
          <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">
            {{$t('AMinvtit', [nomm, nomg])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
      </q-header>

      <q-page-container>

      </q-page-container>
    </q-layout>
  </q-dialog>
-->

  <!-- Dialogue de gestion des droits -->
  <q-dialog v-model="ui.d[idc].AMdroits" persistent full-height position="left">
    <q-layout container view="hHh lpR fFf" :class="styp('md')">
      <q-header elevated>
        <q-toolbar class="tbs">
          <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">
            {{$t('AMdroitstit', [nomm, nomg])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
      </q-header>

      <q-page-container>
      <q-card-section>
        <div class="row justify betwwen items-end">
          <span class="titre-lg">{{$t('AMcas' + stm)}}</span>
          <span v-if="stm > 1" class="titre-md q-ml-md">[ {{edFlags2}} ]</span>
        </div>

        <div v-if="optAvAnims.length" class="bord2 column q-pa-xs q-mb-sm titre-md">
          <q-checkbox :disable="stm === 5 && !session.compte.mav.has(id)"
            dense v-model="animAp" :label="$t('AManimateur')" />
          <q-checkbox dense v-model="idm" :label="$t('AMmembres')" />
          <q-checkbox dense v-model="idn" :label="$t('AMlecture')" />
          <q-checkbox dense v-if="idn" v-model="ide" :label="$t('AMecriture')" />
        </div>
        <div v-if="nbAnimsAp" class="titre-md text-italic q-my-sm">{{$t('AMnbanim', [nbAnimsAp])}}</div>
        <div v-if="!nbAnimsAp && !gr.nbAnims" class="titre-md text-italic q-my-sm">{{$t('AMnbanim1')}}</div>
        <div v-if="!nbAnimsAp && gr.nbAnims" class="stx2 titre-lg q-my-sm">{{$t('AMnbanim2')}}</div>
        <div class="q-mt-sm bord2 column q-pa-xs q-mb-sm titre-md">
          <q-checkbox v-model="iam" dense 
            :label="$t('ICcflm' + (pasmoi ? 'b' : ''))" :disable="pasmoi"/>
          <q-checkbox v-model="ian" dense 
            :label="$t('ICcfln' + (pasmoi ? 'b' : ''))" :disable="pasmoi"/>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-gutter-xs">
        <btn-cond flat size="md" icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
        <btn-cond color="warning" icon="check"
          :label="$t('AMconf5')"
          :disable="!chgDr"
          @ok="changer"/>
      </q-card-actions>
      </q-page-container>
    </q-layout>
  </q-dialog>

  <!-- Dialogue de radiation -->
  <q-dialog v-model="ui.d[idc].AMradiation" persistent full-height position="left">
    <q-layout container view="hHh lpR fFf" :class="styp('md')">
      <q-header elevated>
        <q-toolbar class="tbs">
          <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">
            {{$t('AMradtit', [nomm, nomg])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
      </q-header>

      <q-page-container>
      <q-card-section>
        <div class="row justify betwwen items-end q-mb-sm">
          <span class="titre-lg">{{$t('AMcas' + (stm === 1 ? '1b' : stm))}}</span>
          <span v-if="stm > 1 && stm < 4" class="titre-md q-ml-md">[ {{edFlagsiv}} ]</span>
          <span v-if="stm >= 4" class="titre-md q-ml-md">[ {{edFlags2}} ]</span>
        </div>

        <div v-if="nbActifsAp">
          <div v-if="nbAnimsAp2" class="titre-md text-italic q-my-sm">{{$t('AMnbanim', [nbAnimsAp2])}}</div>
          <div v-if="!nbAnimsAp2 && !gr.nbAnims" class="titre-md text-italic q-my-sm">{{$t('AMnbanim1')}}</div>
          <div v-if="!nbAnimsAp2 && gr.nbAnims" class="stx2 titre-lg">{{$t('AMnbanim2')}}</div>
          <div v-if="im === gr.imh" class="stx2 titre-lg">{{$t('AMradheb')}}</div>
        </div>
        <div v-else class="stx2 titre-lg">{{$t('AMnbactifs')}}</div>

        <q-option-group v-model="rad" :options="optRad" color="primary" />
      </q-card-section>

      <q-card-actions align="right" class="q-gutter-xs">
        <btn-cond flat size="md" icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
        <btn-cond color="warning" icon="close"
          :label="$t('AMconf6')"
          @ok="radier"/>
      </q-card-actions>
      </q-page-container>
    </q-layout>
  </q-dialog>

  <!--<q-dialog v-model="ui.d[idc].IAaccinvit" full-height persistent position="left">
    <invitation-acceptation :inv="gSt.getInvit(gr.id, id)"/>
  </q-dialog>-->

  <dial-std2 v-if="m2" v-model="m2" :titre="$t('ICtit2', [nomm, nomg])">
    <invitation-acceptation :inv="gSt.getInvit(gr.id, id)"/>
  </dial-std2>
</div>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue'

import { $t, styp, dkli, dhcool, afficher8000, afficherDiag } from 'src/app/util.mjs'
import { AMJ, edit, FLAGS, MAXTAILLEGROUPE } from '../app/api.mjs'
import stores from '../stores/stores.mjs'
import ApercuGenx from './ApercuGenx.vue'
import BoutonBulle2 from './BoutonBulle2.vue'
import BoutonHelp from './BoutonHelp.vue'
import BtnCond from './BtnCond.vue'
import { InvitationGroupe, MajDroitsMembre, RadierMembre } from '../app/operations4.mjs'
import ShowHtml from './ShowHtml.vue'
import DialStd2 from '../dialogues/DialStd2.vue'
import InvitationAcceptation from './InvitationAcceptation.vue'
import EditeurMd from './EditeurMd.vue'
import SelAvidgr from './SelAvidgr.vue'

const session = stores.session
const gSt = stores.groupe
const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const m2 = computed(() => ui.d[idc].IAaccinvit)
const m1 = computed(() => ui.d[idc].AMinvit)

const props = defineProps({ 
  id: String, // id de l'avatar membre
  idx: Number
})

const ouvert = ref(false)
const optRMSV = ref([])
const optSuppr = ref([
  { label: $t('AMoptSupp1'), value: 1},
  { label: $t('AMoptSupp2'), value: 2},
  { label: $t('AMoptSupp3'), value: 3}
])
const optRad = ref([])
const rmsv = ref(1) // 1 = ref(ne pas changer, 2:modifier, 3 = ref(supprimer, 4 = ref(voter
const ina = ref(false)
const idm = ref(false) 
const idn = ref(false) 
const ide = ref(false) 
const iam = ref(false) 
const ian = ref(false)
const msg = ref('')
const invparf = ref(null)
const suppr = ref(1)
const flAvant = ref(0)
const animAp = ref(true)
const rad = ref(1)

const avid = computed(() => session.avatarId)
const nomg = computed(() => session.getCV(gr.value.id).nom)
const nomm = computed(() => session.getCV(props.id).nomC)
const pasmoi = computed(() => !session.estAvc(props.id))
const estAnim = computed(() => gr.value.estAnim(gr.value.mmb.get(session.avatarId)) )

const mb = computed(() => gSt.egrC && gSt.egrC.membres ? gSt.egrC.membres.get(im.value) : null)
const im = computed(() => gSt.egrC && gSt.egrC.groupe ? gSt.egrC.groupe.mmb.get(props.id) : 0)
const gr = computed(() => gSt.egrC.groupe)
const amb = computed(() => gr.value.accesMembre(im.value))
const ano = computed(() => gr.value.accesNote2(im.value))
const fl = computed(() => gr.value.flags[im.value])
const stm = computed(() => gr.value.st[im.value])
const animInv = computed(() => gSt.animInv(im.value))
const invits = computed(() => gr.value.invits[im.value] || { fl: 0, li: []})
const invpar = computed(() => { const x = invits.value.li[0]
  return x ? session.getCV(gr.value.tid[x]).nomC : ''
})
const condm = computed(() => {
  const s = new Set()
  const ln = gr.value.enLNG(props.id) || gr.value.enLNC(props.id) 
  // Peut créer / modifier / supprimer une invitation
  if (stm.value >= 1 && stm.value <= 3 && gSt.egrC.estAnim && !ln) s.add(1)
  // Peut accepter / refuser SA PROPRE invitation
  if (stm.value === 3 && session.estAvc(props.id) && !ln) s.add(2)
  // Gestion des droits et accès
  if (stm.value >= 4 && !ln && (session.estAvc(props.id) || gSt.egrC.estAnim)) s.add(3)
  // Gestion radiations
  if (stm.value > 0 && (session.estAvc(props.id) || gSt.egrC.estAnim)) s.add(4)
  return s
})
const edFlagsiv = computed(() => { 
  const f = invits.value.fl
  if (!f) return ''
  const ed = []
  if (f & FLAGS.AN) ed.push($t('AMinvan'))
  if (f & FLAGS.DM) ed.push($t('AMinvdm'))
  if (f & FLAGS.DE) ed.push($t('AMinvde'))
  else if (f & FLAGS.DN) ed.push($t('AMinvdn'))
  return ed.join(', ')
})
const edFlags2 = computed(() => { 
  const f = fl.value
  if (!f) return ''
  const ed = []
  if (stm.value === 5) ed.push($t('AMinvan'))
  if (f & FLAGS.DM) ed.push($t('AMinvdm'))
  if (f & FLAGS.DE) ed.push($t('AMinvde'))
  else if (f & FLAGS.DN) ed.push($t('AMinvdn'))
  return ed.join(', ')
})
const nvfl = computed(() =>{ let fl = 0
  if (ina.value) fl |= FLAGS.AN 
  if (idm.value) fl |= FLAGS.DM 
  if (idn.value) fl |= FLAGS.DN
  if (ide.value) fl |= FLAGS.DE 
  return fl
})
const nvfl2 = computed(() =>{ let fl = 0
  if (iam.value) fl |= FLAGS.AM
  if (ian.value) fl |= FLAGS.AN
  if (idm.value) fl |= FLAGS.DM 
  if (idn.value) fl |= FLAGS.DN
  if (ide.value) fl |= FLAGS.DE 
  return fl
})
const chgDr = computed(() => nvfl2.value !== flAvant.value || (animAp.value !== (stm.value === 5 ? true : false)))
const optAvAnims = computed(() => gSt.avcAnims)
const nbAnimsAp = computed(() => { const anav = stm.value === 5 ? true : false; const n = gr.value.nbAnims
  if (animAp.value && !anav) return n + 1
  if (!animAp.value && anav) return n - 1
  return n
})
const nbAnimsAp2 = computed(() => { const anav = stm.value === 5 ? true : false; const n = gr.value.nbAnims
  return anav ? n - 1 : n
})
const nbActifsAp = computed(() => { const acav = stm.value >= 4 ? true : false; const n = gr.value.nbActifs
  return acav ? n - 1 : n
})


watch(ouvert, (v) => { if (v) session.setMembreId(im.value) })

const edd = (ad) => {
  let r
  if (!ad[0] && !ad[1]) r = $t('jamais')
  else if (!ad[0] && ad[1]) r = $t('avant', [AMJ.editDeAmj(ad[1], true)])
  else if (ad[0] && !ad[1]) r = $t('depuis', [AMJ.editDeAmj(ad[0], true)])
  else if (ad[0] && ad[1]) r = $t('entre', [AMJ.editDeAmj(ad[0], true), AMJ.editDeAmj(ad[1], true)])
  return r
}

const xd = (d) => !d ? '-' : AMJ.editDeAmj(d, true)

function gererDroits () {
  ian.value = (fl.value & FLAGS.AN) !== 0
  iam.value = (fl.value & FLAGS.AM) !== 0
  idm.value = (fl.value & FLAGS.DM) !== 0
  idn.value = (fl.value & FLAGS.DN) !== 0
  ide.value = (fl.value & FLAGS.DE) !== 0
  flAvant.value = nvfl2.value

  animAp.value = stm.value === 5 ? true : false

  session.setMembreId(im.value)
  ui.oD('AMdroits', idc)
}

async function changer () {
  const r = await new MajDroitsMembre().run(props.id, nvfl2.value, animAp.value)
  if (r) await afficher8000(r, props.id, session.groupeId)
  ui.fD()
}

function radiation () {
  const x = session.estAvc(props.id) ? 'b' : 'a'
  optRad.value  = [ ]
  if (gr.value.st[im.value] > 1) optRad.value .push({ label: $t('AMoptRad1' + x), value: 1})
  optRad.value .push({ label: $t('AMoptRad2' + x), value: 2})
  optRad.value .push({ label: $t('AMoptRad3' + x), value: 3})
  session.setMembreId(im.value)
  ui.oD('AMradiation', idc)
}

async function radier () {
  const r = await new RadierMembre().run(props.id, rad.value)
  if (r) await afficher8000(r, props.id, session.groupeId)
  ui.fD()
}

async function ouvririnvit () { 
  if (gr.value.taille >= MAXTAILLEGROUPE) {
    await afficherDiag($t('AMinvittg', [MAXTAILLEGROUPE]))
    return
  }
  rmsv.value  = stm.value === 1 ? 0 : 1
  const fl = invits.value.fl
  ina.value = (fl & FLAGS.AN) !== 0
  idm.value = (fl & FLAGS.DM) !== 0
  idn.value = (fl & FLAGS.DN) !== 0
  ide.value = (fl & FLAGS.DE) !== 0
  msg.value = mb.value.msg || $t('invitation')
  suppr.value = 1

  optRMSV.value = [
    { label: $t('AMopt1'), value: 1 },
    { label: $t('AMopt2'), value: 2 },
    { label: $t('AMopt3'), value: 3 },
  ]
  if (stm.value === 2 && animInv.value[1].size) {
    let ok = false
    session.compte.mpg.get(session.groupeId).forEach(ida => {
      if (animInv.value[1].has(ida)) ok = true
    })
    if (ok) optRMSV.value.push({ label: $t('AMopt4'), value: 4 })
  }

  if (!gr.value.msu && optAvAnims.value.length) invparf.value = optAvAnims.value[0]

  session.setMembreId(im.value)
  ui.oD('AMinvit', idc)
}

async function inviter () { 
  /* rmsv: 0: inviter, 2: modifier, 3: supprimer, 4: voter pour */
  const idi = !gr.value.msu && invparf.value ? invparf.value.value : 0
  const r = await new InvitationGroupe()
    .run(rmsv.value, props.id, idi, nvfl.value, msg.value, suppr.value)
  if (r) await afficher8000(r, props.id, session.groupeId)
  ui.fD()
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.stx
  background-color: $yellow-3
  font-size: 0.8rem
  padding: 1px
  font-weight: bold
  font-style: italic
  color: black
  margin: 0 2px 0 0
.stx2
  background-color: $negative
  font-size: 0.8rem
  padding: 1px
  font-weight: bold
  color: white
  margin: 5px 2px
.lgsel
  width: 10rem
.mlx
  margin-left: 3rem
.q-tab
  min-height: 0 !important
.bord2, .bordm
  border-radius: 5px
  padding: 3px
.bordm
  border: 2px solid $primary
.bord1
  border-bottom: 1px solid $grey-5
.bord2
  border: 1px solid $grey-5
</style>
