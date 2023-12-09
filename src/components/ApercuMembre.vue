<template>
  <q-expansion-item :class="dkli(idx)" v-model="qexp"
    switch-toggle-side expand-separator dense group="trgroup">
    <template v-slot:header>
      <div class="column full-width">
        <apercu-genx v-if="people" :id="na.id" :im="im" :idx="idx"/>
        <div v-else class="row justify-between full-width">
          <div>
            <span class="titre-lg text-bold text-primary">{{$t('moi2', [na.nom])}}</span>
            <span class="q-ml-lg font-mono fs-sm">{{'#' + idav}}</span>
          </div>
          <bouton-membre v-if="!nopanel" :eg="eg" :im="im" btn/>
        </div>
        <div>
          <span class="titre-md text-bold">{{$t('AMm' + stm)}}</span>
          <span v-if="eg.groupe.estHeb(im)" class="q-ml-sm titre-md text-bold text-warning">{{$t('AMmh')}}</span>
          <span v-if="im === 1" class="q-ml-sm titre-md text-bold text-warning">{{$t('AMmf')}}</span>
          <span v-if="eg.groupe.accesMembre(im)" class="q-ml-sm titre-md">- {{$t('AMmm')}}</span>
          <span v-if="ano !== 0" class="q-ml-sm titre-md">- {{$t('AMn' + ano)}}</span>
        </div>
      </div>
    </template>

    <div>
      <div class="q-ml-lg q-mt-sm row justify-between">
        <div class="titre-md">{{$t('AMhist')}}</div>
        <bouton-bulle2 :texte="edit(fl, $t, '\n')" :label="$t('details')"/>
      </div>

      <div class="mlx">
        <div class="row">
          <div class="text-italic col-6">{{$t('AMactif')}}</div>
          <div v-if="mb" class="col-6">{{edd([mb.dac, mb.fac])}}</div>
          <div v-else class="col-6">{{$t('etre', eg.groupe.actifH(im))}}</div>
        </div>
        <div class="row">
          <div class="text-italic col-6">{{$t('AMmembres')}}</div>
          <div v-if="mb" class="col-6">{{edd([mb.dam, mb.fam])}}</div>
          <div v-else class="col-6">{{$t('etre', eg.groupe.accesMembreH(im))}}</div>
        </div>
        <div class="row">
          <div class="text-italic col-6">{{$t('AMlecture')}}</div>
          <div v-if="mb" class="col-6">{{edd([mb.dln, mb.fln])}}</div>
          <div v-else class="col-6">{{$t('etre', eg.groupe.accesLecNoteH(im))}}</div>
        </div>
        <div class="row">
          <div class="text-italic col-6">{{$t('AMecriture')}}</div>
          <div v-if="mb" class="col-6">{{edd([mb.den, mb.fen])}}</div>
          <div v-else class="col-6">{{$t('etre', eg.groupe.accesEcrNoteH(im))}}</div>
        </div>
        <div v-if="mb && !mb.ddi" class="text-italic">{{$t('AMinv0')}}</div>
        <div v-if="mb && mb.ddi" class="row">
          <div class="text-italic col-6">{{$t('AMinvd')}}</div>
          <div class="col-6">{{xd(mb.ddi)}}</div>
        </div>

        <div v-if="stm <= 1">
          <div v-if="enLNC" class="text-bold">{{$t('AMlnc')}}</div>
          <div v-if="enLNA" class="text-bold">{{$t('AMlna')}}</div>
          <div v-if="!enLNA && !enLNC">
            <div v-if="stm === 1" class="text-italic">
              <span>{{$t('AMinvit')}}</span>
              <span v-if="fl & FLAGS.PA" class="q-ml-sm">- {{$t('AMinvan')}}</span>
              <span v-if="fl & FLAGS.DM" class="q-ml-sm">- {{$t('AMinvam')}}</span>
              <span v-if="(fl & FLAGS.DN) && !(fl & FLAGS.DE)" class="q-ml-sm">- {{$t('AMinvln')}}</span>
              <span v-if="fl & FLAGS.DE" class="q-ml-sm">- {{$t('AMinven')}}</span>
            </div>

            <q-btn v-if="mb && stm===0 && eg.groupe.msu === null && eg.estAnim && invitable" 
              icon="add" dense size="sm" color="primary"
              :label="$t('AMinvitbtn1')" @click="ouvririnvit(1)"/>

            <q-btn v-if="mb && stm===1 && eg.groupe.msu === null && eg.estAnim" 
              icon="edit" dense size="sm" color="primary"
              :label="$t('AMinvitbtn2')" @click="ouvririnvit(2)"/>
            <q-btn v-if="mb && stm===1 && eg.groupe.msu === null && eg.estAnim" 
              class="q-ml-sm" icon="delete" dense size="sm" color="primary"
              :label="$t('AMinvitbtn3')" @click="ouvririnvit(3)"/>

            <div v-if="mb && eg.groupe.msu !== null && mb.flagsiv">
              <div class="titre-md">{{$t('AMinvev', [edFlagsiv])}}</div>
              <div class="fs-md q-ml-md">
                <span class="text-italic">{{$t('AMinvvp')}}</span>
                <span class="q-ml-sm" v-for="l of gSt.animInv[0]" :key="l.id">{{l.nomc}}</span>
              </div>
              <div class="fs-md q-ml-md">
                <span class="text-italic">{{$t('AMinvvc')}}</span>
                <span class="q-ml-sm" v-for="l of gSt.animInv[1]" :key="l.id">{{l.nomc}}</span>
              </div>
            </div>

            <q-btn v-if="mb && stm===0 && eg.groupe.msu !== null" icon="how_to_vote" dense size="sm" color="primary"
              :label="$t('AMinvitbtn4')" @click="ouvririnvit(4)"/>

            <q-btn v-if="mb && stm===1 && eg.groupe.msu !== null" icon="how_to_vote" dense size="sm" color="primary"
              :label="$t('AMinvitbtn3')" @click="ouvririnvit(6)"/>

            <q-btn v-if="mb && stm===1 && moi" size="sm" icon="check" class="q-ml-sm"
              dense :label="$t('AMaccinv')" color="primary" @click="accinviter(im)"/>

          </div>
        </div>

        <div>
          <q-btn v-if="stm === 2 || stm === 3" @click="ouvcfg"
            :label="$t('AMcfbtn')" icon="settings" dense size="mg" color="primary"/>
        </div>
      </div>
    </div>

    <q-dialog v-model="accinvit" full-height persistent>
      <invitation-acceptation :idg="eg.groupe.id" :im="imc"/>
    </q-dialog>

    <!-- Dialogue de configuration -->
    <q-dialog v-model="ui.d.AMconfig" persistent>
      <q-card class="bs moyennelargeur" style="min-height:20rem">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-md text-center q-mx-sm">{{$t('AMcftit', [na.nom, eg.groupe.na.nom])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <q-toolbar inset class="bg-secondary text-white row justify-between">
          <q-tabs  class="col titre-md" v-model="cfgtab" inline-label outside-arrows mobile-arrows no-caps>
            <q-tab name="droits" :label="$t('AMcftb1')" @click="ui.setTab('groupe')"/>
            <q-tab name="resil" :disable="!moi && !eg.estAnim" :label="$t('AMcftb2')"/>
          </q-tabs>
        </q-toolbar>

        <div v-if="cfgtab==='droits'" class="q-pa-xs">
          <div class="row titre-md text-italic">
            <div class="col-9">{{$t('AMdrt1')}}</div>
            <div class="col-3">{{$t('AMdrt2')}}</div>
          </div>
          <div v-if="drro" class="q-ma-sm bg-yellow-5 text-bold text-warning">{{$t('AMcfer4')}}</div>
          <div class="row"> 
            <q-checkbox class="col-9 text-center" :disable="drro" v-model="dra" :label="$t('AMdra')" />
            <!--q-checkbox class="col-3 text-center" disable v-model="dra"/-->
          </div>
          <div v-if="dernierAnim" class="bg-yellow-5 text-warning text-bold">{{$t('AMcfer3')}}</div>
          <div class="row"> 
            <q-checkbox class="col-9 text-center" :disable="drro" v-model="drm" :label="$t('AMdrm')" />
            <q-checkbox class="col-3 text-center" :disable="!moi" v-model="adrm"/>
          </div>
          <div class="row"> 
            <q-checkbox class="col-9 text-center" :disable="drro" v-model="drl" :label="$t('AMdrl')" />
            <q-checkbox class="col-3 text-center" :disable="!moi" v-model="adrl"/>
          </div>
          <div class="row"> 
            <q-checkbox class="col-9 text-center" :disable="drro" v-model="dre" :label="$t('AMdre')" />
            <!--q-checkbox class="col-3 text-center" disable v-model="adrl"/-->
          </div>

          <q-card-actions>
            <q-btn flat :label="$t('renoncer')" color="primary" @click="ui.fD"/>
            <q-btn :disable="!chgdr" flat :label="$t('valider')" color="primary" @click="changerdr"/>
          </q-card-actions>
        </div>

        <div v-if="cfgtab==='resil'" class="q-pa-xs">
          <div v-if="moi">
            <div class="titre-md text-italic">{{$t('AMcftit2')}}</div>
            <div class="column q-my-sm">
              <span><q-radio v-model="decl" :val="1" :label="$t('ICd2')"/><bouton-bulle idtext="oublc1"/></span>
              <span><q-radio v-model="decl" :val="2" :label="$t('ICd3')" /><bouton-bulle idtext="oublc2"/></span>
              <span><q-radio v-model="decl" :val="3" :label="$t('ICd4')" /><bouton-bulle idtext="oublc3"/></span>
            </div>
            <div class="row justify-center q-gutter-lg">
              <q-btn flat :label="$t('renoncer')" color="primary" @click="ui.fD"/>
              <bouton-confirm :actif="cfln" :confirmer="ko"/>
            </div>
          </div>
          <div v-else>
            <div class="titre-md text-italic">{{$t('AMcftit3')}}</div>
            <div v-if="(fl & FLAGS.AC) || (fl & FLAGS.IN)" 
              class="q-ma-sm bg-yellow-5 text-bold text-warning">
              <div v-if="(fl & FLAGS.AC)">{{$t('AMcfer1')}}</div>
              <div v-if="(fl & FLAGS.IN)">{{$t('AMcfer2')}}</div>
            </div>
            <div v-else>
              <div class="column q-my-sm">
                <span><q-radio v-model="decl" :val="4" :label="$t('ICd5')"/><bouton-bulle idtext="oubla1"/></span>
                <span><q-radio v-model="decl" :val="5" :label="$t('ICd6')" /><bouton-bulle idtext="oubla2"/></span>
              </div>
              <div class="row justify-center q-gutter-lg">
                <q-btn flat :label="$t('renoncer')" color="primary" @click="ui.fD"/>
                <bouton-confirm :actif="cfln" :confirmer="ko"/>
              </div>
            </div>
          </div>
        </div>
      </q-card>
    </q-dialog>

    <!-- Dialogue d'invitation -->
    <q-dialog v-model="ui.d.AMinvit" persistent>
      <q-card class="bs moyennelargeur">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('AMinvtit', [na.nom, eg.groupe.na.nom])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>

        <q-card-section v-if="cas > 3">
          <div class="titre-md">{{$t('AMinvev', [edFlagsiv])}}</div>
          <div class="fs-md q-ml-md">
            <span class="text-italic">{{$t('AMinvvp')}}</span>
            <span class="q-ml-sm" v-for="l of gSt.animInv[0]" :key="l.id">{{l.nomc}}</span>
          </div>
          <div class="fs-md q-ml-md">
            <span class="text-italic">{{$t('AMinvvc')}}</span>
            <span class="q-ml-sm" v-for="l of gSt.animInv[1]" :key="l.id">{{l.nomc}}</span>
          </div>
        </q-card-section>

        <q-card-section class="column q-ma-xs q-pa-xs titre-md">
          <div class="row">
            <q-select class="q-mb-md lgsel" v-model="invpar" :options="options" :label="$t('AMinvpar')" />
            <span v-if="cas === 4 && gSt.animInv[0].indexOf(invpar.value) !== -1"
              class= "q-ml-md text-bold text-warning bg-yellow-3">{{$t('AMdejav')}}</span>
          </div>
          <q-checkbox :disable="!drupd" v-model="ipa" :label="$t('FLAGS7')" />
          <q-checkbox :disable="!drupd" v-model="idm" :label="$t('FLAGS3')" />
          <q-checkbox :disable="!drupd" v-model="idn" :label="$t('FLAGS5')" />
          <q-checkbox :disable="!drupd" v-if="idn" v-model="ide" :label="$t('FLAGS6')" />
          <div v-if="drupd" class="q-mt-sm height-3">
            <div v-if="cas === 2 && mb.flagsiv === nvflags">{{$t('AMnochg')}}</div>
            <div v-if="cas === 4 && mb.flagsiv !== nvflags"
              class= "text-bold text-warning bg-yellow-3">{{$t('AMchg')}}</div>
          </div>
        </q-card-section>
        <q-card-section>
          <div class="titre-md text-italic">{{$t('AMbienv')}}</div>
          <editeur-md class="bord" :lgmax="1000" v-model="ard" :texte="mb.ard || ''" modetxt mh="5rem"
            editable/>
        </q-card-section>
        <q-card-actions vertical>
          <q-btn flat :label="$t('renoncer')" color="primary" @click="ui.fD"/>
          <q-btn v-if="cas === 1" flat :label="$t('AMinviter')" color="primary" @click="inviter(1)"/>
          <q-btn v-if="cas === 2" :disable="mb.flagsiv === nvflags"
            flat :label="$t('AMmodinv')" color="primary" @click="inviter(2)"/>
          <q-btn v-if="cas === 3" flat :label="$t('AMdelinv')" color="warning" @click="inviter(3)"/>
          <q-btn v-if="cas === 4" :label="$t('AMvpour')" :color="mb.flagsiv === nvflags ? 'primary' : 'warning'" 
            :disable="gSt.animInv[0].indexOf(invpar) !== -1 && mb.flagsiv === nvflags" @click="inviter(4)"/>
          <q-btn v-if="cas === 4" :label="$t('AMvcontre')" :color="mb.flagsiv === nvflags ? 'primary' : 'warning'" 
            :disable="gSt.animInv[1].indexOf(invpar) !== -1" @click="inviter(5)"/>
          <q-btn v-if="cas === 6" flat :label="$t('AMdelinv')" color="warning" @click="inviter(6)"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-expansion-item>
</template>
<script>
import { ref, toRef } from 'vue'

import { dkli, $t } from 'src/app/util.mjs'
import { AMJ, edit, FLAGS } from '../app/api.mjs'
import stores from '../stores/stores.mjs'
import BoutonConfirm from './BoutonConfirm.vue'
import BoutonMembre from './BoutonMembre.vue'
import ApercuGenx from './ApercuGenx.vue'
import BoutonHelp from './BoutonHelp.vue'
import BoutonBulle2 from './BoutonBulle2.vue'
import BoutonBulle from './BoutonBulle.vue'
import EditeurMd from './EditeurMd.vue'
import InvitationAcceptation from './InvitationAcceptation.vue'
import { getNg } from '../app/modele.mjs'
import { OublierMembre, MajDroitsMembre, InvitationGroupe } from '../app/operations.mjs'

export default {
  name: 'ApercuMembre',

  props: { 
    mb: Object, // ABSENT pour un avatar du compte
    idav: Number, // id de l'avatar membre
    im: Number,
    eg: Object,
    mapmc: Object,
    idx: Number, 
    people: Boolean,
    nopanel: Boolean // Ne pas mettre le bouton menant à PanelMembre
  },

  components: { InvitationAcceptation, BoutonConfirm, BoutonHelp, ApercuGenx, BoutonMembre, BoutonBulle2, BoutonBulle, EditeurMd },

  computed: {
    amb () { return this.gSt.ambano[0] },

    stm () { return this.eg.groupe.statutMajeur(this.im) },

    ano () { return this.eg.groupe.accesNote(this.im) },

    // accès aux notes autorisé MAIS NON activé
    anona () { return this.eg.groupe.accesNoteNA(this.im) },

    // accès aux membres autorisé MAIS NON activé
    ambna () { return this.eg.groupe.accesMembreNA(this.im) },

    fl () { return this.eg.groupe.flags[this.im] },
    
    enLNA () { return this.eg.groupe.enLNA(this.im) },
    enLNC () { return this.eg.groupe.enLNC(this.im) },

    invitable () { return this.eg.groupe.estInvitable(this.im) },

    edFlagsiv () { 
      const f = this.mb.flagsiv
      if (!f) return ''
      const ed = []
      if (f & FLAGS.PA) ed.push(this.$t('AMinvpa'))
      if (f & FLAGS.DM) ed.push(this.$t('AMinvdm'))
      if (f & FLAGS.PE) ed.push(this.$t('AMinvpe'))
      else if (f & FLAGS.DN) ed.push(this.$t('AMinvdn'))
      return ed.join(', ')
    },

    una () { return this.eg.groupe.inv !== null },

    nvflags () {
      let n = 0
      if (this.ipa) n |= FLAGS.PA
      if (this.idm) n |= FLAGS.DM
      if (this.ide) n |= FLAGS.DE | FLAGS.DN
      else if (this.idn) n |= FLAGS.DN
      return n
    },

    nvflags2 () {
      let n = 0
      if (this.dra) n |= FLAGS.PA
      if (this.drm) n |= FLAGS.DM
      if (this.drl) n |= FLAGS.DN
      if (this.dre) n |= FLAGS.DE | FLAGS.DN
      if (this.adrm) n |= FLAGS.AM
      if (this.adrl) n |= FLAGS.AN
      return n
    },

    drupd () { return this.cas < 3 || this.cas === 4 || this.cas === 5 },

    /* droits de modification des droits
    - être animateur (un des avc est animateur)
    - ET la cible n'est pas animateur OU la cible est un avc (c'est moi)
    */
    drro () { 
      return !(this.eg.estAnim && (!this.eg.groupe.estAnim(this.im) || this.moi))
    },

    moi () { return this.aSt.compte.estAvDuCompte(this.idav) },

    chgdr () { return this.flags2av !== this.nvflags2 },

    cfln () { return this.decl !== 0 },

    dernierAnim () { const g = this.eg.groupe
      return this.moi && g.nbAnims <= 1 && this.dra === false }
  },

  watch: {
    drm (v) {
      if (v) this.adrm = (this.fl & FLAGS.AM) !== 0
      else this.adrm = false
    },
    drl (v) {
      if (v) this.adrl = (this.fl & FLAGS.AN) !== 0
      else { this.adrl = false; this.dre = false }
    },
    dre (v) {
      if (v) this.drl = true
    },
    adrm (v) {
      if (v && !this.drm) this.adrm = false
    },
    adrl (v) {
      if (v && !this.drl) this.adrl = false
    },
    qexp (v) {
      if (v) this.session.setMembreId(this.im)
    }
  },

  data () { return {
    qexp: false,
    /* 
    1: invit std, 2: modif invit std, 3: suppr invit std, 
    4: vote pour, 5: vote contre, 6: suppr invit una 
    */
    cas: 0,
    ipa: false, idm: false, idn: false, ide: false,
    invpar: null,
    options: null,
    ard: '',
    cfgtab: 'droits',
    dra:0, drm: 0, drl:0, dre: 0, adrm: 0, adrl: 0,
    flags2av: 0,
    decl: 0,
    imc: 0
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

    async accinviter (im) {
      if (!await this.session.edit()) return
      this.imc = im
      this.ui.oD('AMaccinvit')
    },

    ouvrirdetails () {
      this.session.setPeopleId(this.idav)
      this.ui.oD('detailspeople')
    },

    async ouvririnvit (cas) {
      if (!await this.session.edit()) return
      if (this.enLNA || this.enLNC) {
        afficherDiag($t('AMlnoire'))
        return
      }
      this.cas = cas
      const fl = this.mb.flagsiv || this.fl
      this.ipa = (fl & FLAGS.PA) !== 0
      this.idm = (fl & FLAGS.DM) !== 0
      this.idn = (fl & FLAGS.DN) !== 0
      this.ide = (fl & FLAGS.DE) !== 0
      this.options = []
      const g = this.eg.groupe
      this.aSt.compte.lstAvatarNas.forEach(na => {
        const im = this.aSt.compte.imGA(this.eg.groupe.id, na.id)
        if (g.estAnim(im) && g.accesMembre(im)) 
          this.options.push({ label: na.nom, value: im })
      })
      if (!this.options.length) {
        afficherDiag(this.$t('AMinvitAnim'))
        return
      }
      this.invpar = this.options[0]
      this.ard = this.mb.ard || ''
      this.session.setMembreId(this.im)
      this.ui.oD('AMovinvit')
    },

    async inviter (cas) { 
      /* 
      1: invit std, 2: modif invit std, 3: suppr invit std, 
      4: vote pour, 5: vote contre, 6: suppr invit una 
      */
      await new InvitationGroupe().run(cas, this.eg.groupe, this.mb, this.invpar.value, this.nvflags, this.ard)
      this.ui.fD()
    },

    async ouvcfg () {
      if (!await this.session.edit()) return
      this.dra = (this.fl & FLAGS.PA) !== 0
      this.drm = (this.fl & FLAGS.DM) !== 0
      this.drl = (this.fl & FLAGS.DN) !== 0
      this.dre = (this.fl & FLAGS.DE) !== 0
      this.adrm = (this.fl & FLAGS.AM) !== 0
      this.adrl = (this.fl & FLAGS.AN) !== 0
      this.flags2av = this.nvflags2
      this.ui.oD('AMconfig')
    },

    async changerdr () {
      await new MajDroitsMembre().run(this.eg.groupe.id, this.im, this.nvflags2)
      this.ui.fD()
    },

    async ko () {
      await new OublierMembre().run(this.eg.groupe.na, this.na, this.im, this.decl)
      this.ui.fD()
    }

  },

  setup (props) {
    const session = stores.session
    const ui = stores.ui
    const gSt = stores.groupe
    const aSt = stores.avatar

    const mb = toRef(props, 'mb')
    const idav = toRef(props, 'idav')
    const na = ref(mb.value ? mb.value.na : getNg(idav.value))
    const cv = ref(mb.value ? mb.value.cv : aSt.getAvatar(idav.value).cv)
    // const im = toRef(props, 'im')
    // const eg = toRef(props, 'eg')
    // console.log(edit(eg.value.groupe.flags[im.value]))

    return {
      FLAGS, dkli, edit,
      session, gSt, aSt, ui,
      na, cv
    }
  }
}
</script>
<style lang="css">
.q-item__section--side { padding-right: 5px !important; }
</style>
<style lang="sass" scoped>
@import '../css/app.sass'
.lgsel
  width: 10rem
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.mlx
  margin-left: 2rem
.q-tab
  min-height: 0 !important
</style>
