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
  <q-dialog v-model="ui.d.AMinvit[idc]" persistent full-height position="left">
    <q-layout container view="hHh lpR fFf" :class="styp('md')">
      <q-header elevated>
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">
            {{$t('AMinvtit', [nomm, nomg])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
      </q-header>

      <q-page-container>
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
        <editeur-md class="q-mb-sm bord1" :lgmax="1000" v-model="msg" :texte="mb.msg || ''" 
          modetxt mh="8rem" editable/>
      </q-card-section>

      <q-card-section v-if="rmsv === 3" class="q-ma-sm">
        <!-- Suppression d'une invitation -->
        <q-option-group dense v-model="suppr" :options="optSuppr" color="primary" />
      </q-card-section>

      <q-card-actions align="right" class="q-gutter-xs">
        <btn-cond flat size="md" icon="undo" :label="$t('renoncer')" @click="ui.fD"/>
        <btn-cond v-if="rmsv !== 1" color="warning" icon="check"
          :label="$t('AMconf' + rmsv)"
          :disable="(rmsv === 0 || rmsv === 2) && (!nvfl || !msg)"
          @ok="inviter"/>
      </q-card-actions>
      </q-page-container>
    </q-layout>
  </q-dialog>

  <!-- Dialogue de gestion des droits -->
  <q-dialog v-model="ui.d.AMdroits[idc]" persistent full-height position="left">
    <q-layout container view="hHh lpR fFf" :class="styp('md')">
      <q-header elevated>
        <q-toolbar class="bg-secondary text-white">
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
        <btn-cond flat size="md" icon="undo" :label="$t('renoncer')" @click="ui.fD"/>
        <btn-cond color="warning" icon="check"
          :label="$t('AMconf5')"
          :disable="!chgDr"
          @ok="changer"/>
      </q-card-actions>
      </q-page-container>
    </q-layout>
  </q-dialog>

  <!-- Dialogue de radiation -->
  <q-dialog v-model="ui.d.AMradiation[idc]" persistent full-height position="left">
    <q-layout container view="hHh lpR fFf" :class="styp('md')">
      <q-header elevated>
        <q-toolbar class="bg-secondary text-white">
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
        <btn-cond flat size="md" icon="undo" :label="$t('renoncer')" @click="ui.fD"/>
        <btn-cond color="warning" icon="close"
          :label="$t('AMconf6')"
          @ok="radier"/>
      </q-card-actions>
      </q-page-container>
    </q-layout>
  </q-dialog>

  <q-dialog v-model="ui.d.IAaccinvit[idc]" full-height persistent position="left">
    <invitation-acceptation :inv="aSt.getAvatar(id).invits.get(gr.id)"/>
  </q-dialog>

</div>
</template>
<script>
import { ref } from 'vue'

import { styp, dkli, dhcool, afficher8000 } from 'src/app/util.mjs'
import { AMJ, edit, FLAGS } from '../app/api.mjs'
import stores from '../stores/stores.mjs'
import ApercuGenx from './ApercuGenx.vue'
import BoutonBulle2 from './BoutonBulle2.vue'
import BoutonHelp from './BoutonHelp.vue'
import BtnCond from './BtnCond.vue'
import { InvitationGroupe, MajDroitsMembre, RadierMembre } from '../app/operations4.mjs'
import ShowHtml from './ShowHtml.vue'
import InvitationAcceptation from './InvitationAcceptation.vue'
import EditeurMd from './EditeurMd.vue'

export default {
  name: 'ApercuMembre',

  props: { 
    id: Number, // id de l'avatar membre
    idx: Number
  },

  components: { ApercuGenx, BoutonBulle2, BoutonHelp, ShowHtml, EditeurMd,
    BtnCond, ShowHtml, InvitationAcceptation },

  computed: {
    avid () { return this.session.avatarId },
    nomg () { return this.session.getCV(this.gr.id).nom },
    nomm () { return this.session.getCV(this.id).nomC },
    pasmoi () { return !this.session.estAvc(this.id)},

    mb () { return this.gSt.egrC && this.gSt.egrC.membres ? this.gSt.egrC.membres.get(this.im) : null },
    im () { return this.gSt.egrC && this.gSt.egrC.groupe ? this.gSt.egrC.groupe.mmb.get(this.id) : 0 },
    gr () { return this.gSt.egrC.groupe },
    amb () { return this.gr.accesMembre(this.im) },
    ano () { return this.gr.accesNote2(this.im) },
    fl () { return this.gr.flags[this.im] },
    stm () { return this.gr.st[this.im]},
    animInv () { return this.gSt.animInv(this.im) },
    invits () { return this.gr.invits[this.im] || { fl: 0, li: []} },
    invpar () { const x = invits.li[0]
      return x ? this.session.getCV(this.gr.tid[x]).nomC : ''
    },
    condm () {
      const s = new Set()
      const ln = this.gr.enLNG(this.id) || this.gr.enLNC(this.id) 
      // Peut créer / modifier / supprimer une invitation
      if (this.stm >= 1 && this.stm <= 3 && this.gSt.egrC.estAnim && !ln) s.add(1)
      // Peut accepter / refuser SA PROPRE invitation
      if (this.stm === 3 && this.session.estAvc(this.id) && !ln) s.add(2)
      // Gestion des droits et accès
      if (this.stm >= 4 && !ln && (this.session.estAvc(this.id) || this.gSt.egrC.estAnim)) s.add(3)
      // Gestion radiations
      if (this.stm > 0 && (this.session.estAvc(this.id) || this.gSt.egrC.estAnim)) s.add(4)
      return s
    },
    edFlagsiv () { 
      const f = this.invits.fl
      if (!f) return ''
      const ed = []
      if (f & FLAGS.AN) ed.push(this.$t('AMinvan'))
      if (f & FLAGS.DM) ed.push(this.$t('AMinvdm'))
      if (f & FLAGS.DE) ed.push(this.$t('AMinvde'))
      else if (f & FLAGS.DN) ed.push(this.$t('AMinvdn'))
      return ed.join(', ')
    },
    edFlags2 () { 
      const f = this.fl
      if (!f) return ''
      const ed = []
      if (this.stm === 5) ed.push(this.$t('AMinvan'))
      if (f & FLAGS.DM) ed.push(this.$t('AMinvdm'))
      if (f & FLAGS.DE) ed.push(this.$t('AMinvde'))
      else if (f & FLAGS.DN) ed.push(this.$t('AMinvdn'))
      return ed.join(', ')
    },
    nvfl () { let fl = 0
      if (this.ina) fl |= FLAGS.AN 
      if (this.idm) fl |= FLAGS.DM 
      if (this.idn) fl |= FLAGS.DN
      if (this.ide) fl |= FLAGS.DE 
      return fl
    },
    nvfl2 () { let fl = 0
      if (this.iam) fl |= FLAGS.AM
      if (this.ian) fl |= FLAGS.AN
      if (this.idm) fl |= FLAGS.DM 
      if (this.idn) fl |= FLAGS.DN
      if (this.ide) fl |= FLAGS.DE 
      return fl
    },
    chgDr () { return this.nvfl2 !== this.flAvant || (this.animAp !== (this.stm === 5 ? true : false)) },
    optAvAnims () { return this.gSt.avcAnims },
    nbAnimsAp () { const anav = this.stm === 5 ? true : false; const n = this.gr.nbAnims
      if (this.animAp && !anav) return n + 1
      if (!this.animAp && anav) return n - 1
      return n
    },
    nbAnimsAp2 () { const anav = this.stm === 5 ? true : false; const n = this.gr.nbAnims
      return anav ? n - 1 : n
    },
    nbActifsAp () { const acav = this.stm >= 4 ? true : false; const n = this.gr.nbActifs
      return acav ? n - 1 : n
    },

  },

  watch: {
    ouvert (v) { if (v) this.session.setMembreId(this.im) },
    // idn () { this.ide = false },
  },

  data () { return {
    ouvert: false,
    optRMSV: [],
    optSuppr: [
      { label: this.$t('AMoptSupp1'), value: 1},
      { label: this.$t('AMoptSupp2'), value: 2},
      { label: this.$t('AMoptSupp3'), value: 3}
    ],
    optRad: [],
    rmsv: 1, // 1: ne pas changer, 2:modifier, 3: supprimer, 4: voter
    ina: false, idm: false, idn: false, ide: false, iam: false, ian: false,
    msg: '',
    invparf: null,
    suppr: 1,
    flAvant: 0,
    animAp: true,
    rad: 1,
  }},

  methods: {
    edd (ad) {
      let r
      if (!ad[0] && !ad[1]) r = this.$t('jamais')
      else if (!ad[0] && ad[1]) r = this.$t('avant', [AMJ.editDeAmj(ad[1], true)])
      else if (ad[0] && !ad[1]) r = this.$t('depuis', [AMJ.editDeAmj(ad[0], true)])
      else if (ad[0] && ad[1]) r = this.$t('entre', [AMJ.editDeAmj(ad[0], true), AMJ.editDeAmj(ad[1], true)])
      // console.log(r)
      return r
    },

    xd (d) { return !d ? '-' : AMJ.editDeAmj(d, true) },

    gererDroits () {
      this.ian = (this.fl & FLAGS.AN) !== 0
      this.iam = (this.fl & FLAGS.AM) !== 0
      this.idm = (this.fl & FLAGS.DM) !== 0
      this.idn = (this.fl & FLAGS.DN) !== 0
      this.ide = (this.fl & FLAGS.DE) !== 0
      this.flAvant = this.nvfl2

      this.animAp = this.stm === 5 ? true : false

      this.session.setMembreId(this.im)
      this.ui.oD('AMdroits', this.idc)
    },

    async changer () {
      const r = await new MajDroitsMembre().run(this.id, this.nvfl2, this.animAp)
      if (r) await afficher8000(r, this.id, this.session.groupeId)
      this.ui.fD()
    },

    radiation () {
      const x = this.session.estAvc(this.id) ? 'b' : 'a'
      this.optRad = [
        { label: this.$t('AMoptRad1' + x), value: 1},
        { label: this.$t('AMoptRad2' + x), value: 2},
        { label: this.$t('AMoptRad3' + x), value: 3}
      ]
      
      this.session.setMembreId(this.im)
      this.ui.oD('AMradiation', this.idc)
    },

    async radier () {
      const r = await new RadierMembre().run(this.id, this.rad)
      if (r) await afficher8000(r, this.id, this.session.groupeId)
      this.ui.fD()
    },

    ouvririnvit () { 
      this.rmsv = this.stm === 1 ? 0 : 1
      const fl = this.invits.fl
      this.ina = (fl & FLAGS.AN) !== 0
      this.idm = (fl & FLAGS.DM) !== 0
      this.idn = (fl & FLAGS.DN) !== 0
      this.ide = (fl & FLAGS.DE) !== 0
      this.msg = this.mb.msg || ''
      this.suppr = 1

      this.optRMSV = [
        { label: this.$t('AMopt1'), value: 1 },
        { label: this.$t('AMopt2'), value: 2 },
        { label: this.$t('AMopt3'), value: 3 },
      ]
      if (this.stm === 2 && this.animInv.lc.size) {
        let ok = false
        this.session.compte.mpg.get(this.session.groupeId).forEach(ida => {
          if (this.animInv.lc.has(ida)) ok = true
        })
        if (ok) this.optRMSV.push({ label: this.$t('AMopt4'), value: 4 })
      }

      if (!this.gr.msu && this.optAvAnims.length) this.invparf = this.optAvAnims[0]

      this.session.setMembreId(this.im)
      this.ui.oD('AMinvit', this.idc)
    },

    async inviter () { 
      /* rmsv: 0: inviter, 2: modifier, 3: supprimer, 4: voter pour */
      const idi = !this.gr.msu && this.invparf ? this.invparf.value : 0
      const r = await new InvitationGroupe()
        .run(this.rmsv, this.id, idi, this.nvfl, this.msg, this.suppr)
      if (r) await afficher8000(r, this.id, this.session.groupeId)
      this.ui.fD()
    }
  },

  setup () {
    const session = stores.session
    const ui = stores.ui
    const idc = ref(ui.getIdc())
    const gSt = stores.groupe
    const aSt = stores.avatar

    return {
      FLAGS, dkli, styp, edit, dhcool,
      session, gSt, aSt, ui, idc
    }
  }
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
