<template>
<div>
  <q-expansion-item :class="dkli(idx)" v-model="qexp"
    switch-toggle-side expand-separator dense group="trgroup">
    <template v-slot:header>
      <div class="column full-width">
        <apercu-genx :id="id" :im="im" :idx="idx"/>
        <div class="row q-gutter-sm titre-md">
          <span class="stx">{{$t('AMm' + stm)}}</span>
          <span v-if="gr.imh === im" class="stx">{{$t('AMmh')}}</span>
          <span v-if="im === 1" class="stx">{{$t('AMmf')}}</span>
          <span v-if="amb" class="stx">{{$t('AMmm')}}</span>
          <span v-if="ano" class="stx">{{$t('AMn' + ano)}}</span>
          <bouton-bulle2 :texte="edit(fl, $t, '\n')"/>
        </div>
      </div>
    </template>

    <div v-if="!mb" class="q-ml-xl titre-md">
      <div class="row">
        <div class="text-italic col-6">{{$t('AMmembres')}}</div>
        <div class="col-6">{{$t('etre', gr.accesMembreH(im))}}</div>
      </div>
      <div class="row">
        <div class="text-italic col-6">{{$t('AMlecture')}}</div>
        <div class="col-6">{{$t('etre', eg.groupe.accesLecNoteH(im))}}</div>
      </div>
      <div class="row">
        <div class="text-italic col-6">{{$t('AMecriture')}}</div>
        <div class="col-6">{{$t('etre', eg.groupe.accesEcrNoteH(im))}}</div>
      </div>

    </div>

    <div v-else class="q-ml-xl">
      <div v-if="mb.dpr" class="row">
        <div class="text-itali col-6">{{$t('AMdpr')}}</div>
        <div class="font-mono text-bold">{{xd(mb.dpr)}}</div>
      </div>
      <div class="row">
        <div class="text-itali col-6">{{$t('AMddi')}}</div>
        <div v-if="mb.ddi" class="font-mono text-bold">{{xd(mb.ddi)}}</div>
        <div v-else class="font-mono text-bold">{{$t('AMinv0')}}</div>
      </div>
      <div v-if="mb.dac" class="row">
        <div class="text-itali col-6">{{$t('AMdac')}}</div>
        <div class="font-mono text-bold">{{xd(mb.dac)}}</div>
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

      <div v-if="(stm === 1 && mb.inv) || stm === 2" class="q-my-xs">
        <div class="text-italic">
          <span>{{$t('AMinvit' + stm)}}</span>
          <span v-if="mb.flinv & FLAGS.AN" class="q-ml-sm">- {{$t('AMinvan')}}</span>
          <span v-if="mb.flinv & FLAGS.DM" class="q-ml-sm">- {{$t('AMinvam')}}</span>
          <span v-if="(mb.flinv & FLAGS.DN) && !(mb.flinv & FLAGS.DE)" class="q-ml-sm">- {{$t('AMinvln')}}</span>
          <span v-if="mb.flinv & FLAGS.DE" class="q-ml-sm">- {{$t('AMinven')}}</span>
        </div>
        <div class="titre-md text-italic q-mt-xs">{{$t('AMbienv')}}</div>
        <show-html :idx="idx" :texte="mb.msg" maxh="4rem" scroll zoom/>
      </div>

      <div v-if="gr.msu !== null && mb.inv">
        <div class="titre-md">{{$t('AMinvev')}}</div>
        <div class="fs-md q-ml-md">
          <span class="text-italic">{{$t('AMinvvp')}}</span>
          <span class="q-ml-sm" v-for="cv of animInv[0]" :key="cv.id">{{cv.nomC}}</span>
        </div>
        <div class="fs-md q-ml-md">
          <span class="text-italic">{{$t('AMinvvc')}}</span>
          <span class="q-ml-sm" v-for="cv of animInv[1]" :key="cv.id">{{cv.nomC}}</span>
        </div>
      </div>

      <div class="q-mt-sm row q-gutter-xs">
        <btn-cond v-if="stm === 1 && gr.msu === null && gSt.egrC.estAnim && invitable" 
          icon="add" cond="cEdit"
          :label="$t('AMinvitbtn1')" @ok="ouvririnvit(1)"/>
        <btn-cond v-if="stm === 2 && gr.msu === null && gSt.egrC.estAnim" 
          icon="edit" cond="cEdit"
          :label="$t('AMinvitbtn2')" @ok="ouvririnvit(2)"/>
        <btn-cond v-if="stm === 2 && gSt.egrC.estAnim" 
          icon="delete" cond="cEdit"
          :label="$t('AMinvitbtn3')" @ok="ouvririnvit(3)"/>
        <btn-cond v-if="(stm === 1 || stm === 2) && gr.msu !== null && gSt.egrC.estAnim" 
          icon="how_to_vote" cond="cEdit"
          :label="$t('AMinvitbtn4')" @ok="ouvririnvit(4)"/>
        <btn-cond v-if="(stm === 1 || stm === 2) && gr.msu !== null && gSt.egrC.estAnim" 
          icon="how_to_vote" cond="cEdit"
          :label="$t('AMinvitbtn3')" @ok="ouvririnvit(6)"/>
      </div>
    </div>
    <!--
        <q-btn v-if="stm===1 && mb && moi" 
          icon="check" dense size="md" color="primary" padding="xs"
          :label="$t('AMaccinv')" @click="accinviter"/>

        <q-btn v-if="stm === 2 || stm === 3"
          icon="settings" dense size="md" color="primary" padding="xs"
          :label="$t('AMcfbtn')" @click="ouvcfg"/>

        <q-btn v-if="oubliable" 
          icon="close" dense size="md" color="warning" padding="xs"
          :label="$t('AMoubtn')" @click="ouvoubli"/>
      -->
  </q-expansion-item>

</div>
</template>
<script>
import { ref, toRef } from 'vue'

import { styp, dkli, afficherDiag, dhcool } from 'src/app/util.mjs'
import { AMJ, edit, FLAGS } from '../app/api.mjs'
import stores from '../stores/stores.mjs'
import ApercuGenx from './ApercuGenx.vue'
import BoutonBulle2 from './BoutonBulle2.vue'
import BtnCond from './BtnCond.vue'
import { OublierMembre, MajDroitsMembre, InvitationGroupe } from '../app/operations.mjs'
import ShowHtml from './ShowHtml.vue'

export default {
  name: 'ApercuMembre',

  props: { 
    id: Number, // id de l'avatar membre
    idx: Number, 
    people: Boolean,
    ouvert: Boolean
  },

  components: { ApercuGenx, BoutonBulle2, ShowHtml, BtnCond },

  computed: {
    mb () { return this.gSt.egrC && this.gSt.egrC.membres ? this.gSt.egrC.membres.get(this.im) : null },
    im () { return this.gSt.egrC && this.gSt.egrC.groupe ? this.gSt.egrC.groupe.mmb.get(this.id) : 0 },
    gr () { return this.gSt.egrC.groupe },
    amb () { return this.gr.accesMembre(this.im) },
    ano () { return this.gr.accesNote2(this.im) },
    fl () { return this.gr.flags[this.im] },
    stm () { return this.gr.st[this.im]},
    animInv () { return gSt.animInv(this.im) },

    invitable () { return this.gr.estInvitable(this.id) },

    /*
    oubliable () { return this.eg.groupe.estOubliable(this.im)},



    stm () { return this.eg.groupe.statutMajeur(this.im) },



    // accès aux notes autorisé MAIS NON activé
    anona () { return this.eg.groupe.accesNoteNA(this.im) },

    // accès aux membres autorisé MAIS NON activé
    ambna () { return this.eg.groupe.accesMembreNA(this.im) },

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
    */

    /* droits de modification des droits
    - être animateur (un des avc est animateur)
    - ET la cible n'est pas animateur OU la cible est un avc (c'est moi)
    
    drro () { 
      return !(this.eg.estAnim && (!this.eg.groupe.estAnim(this.im) || this.moi))
    },

    moi () { return this.aSt.compte.estAvDuCompte(this.na.id) },

    chgdr () { return this.flags2av !== this.nvflags2 },

    cfln () { return this.decl !== 0 },

    dernierAnim () { const g = this.eg.groupe
      return this.moi && g.nbAnims <= 1 && this.dra === false }
    */
  },

  watch: {
    qexp (v) {
      if (v) this.session.setMembreId(this.im)
    }
    /*
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
    */
  },

  data () { return {
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
    dra: false, drm: false, drl: false, dre: false, adrm: false, adrl: false,
    flags2av: 0,
    decl: 0
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

    async accinviter () {
      if (!await this.session.edit()) return
      this.ui.oD('IAaccinvit', this.idc)
    },

    ouvrirdetails () {
      this.session.setPeopleId(this.na.id)
      this.ui.oD('detailspeople')
    },

    async ouvririnvit (cas) { 
      this.cas = cas
      const fl = this.mb.flinv || 0
      this.ina = (fl & FLAGS.NA) !== 0
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
        afficherDiag(this.$t('AMinvitanim'))
        return
      }
      this.invpar = this.options[0]
      this.ard = this.mb.ard || ''
      this.session.setMembreId(this.im)
      this.ui.oD('AMinvit', this.idc)
    },

    async inviter (cas) { 
      /* 
      1: invit std, 2: modif invit std, 3: suppr invit std, 
      4: vote pour, 5: vote contre, 6: suppr invit una 
      */
      await new InvitationGroupe().run(cas, this.eg.groupe, this.mb, this.invpar.value, this.nvflags, this.ard)
      this.ui.fD()
    },

    async ouvoubli () {
      if (!await this.session.edit()) return
      this.ui.oD('AMoubli', this.idc)
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
      this.ui.oD('AMconfig', this.idc)
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
    const idc = ref(ui.getIdc())
    const gSt = stores.groupe
    const aSt = stores.avatar

    const ouvert = toRef(props, 'ouvert')
    const qexp = ref(ouvert.value || false)

    return {
      FLAGS, dkli, styp, edit, dhcool,
      qexp,
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
  padding: 0
  font-weight: bold
  font-style: italic
  color: black
.lgsel
  width: 10rem
.mlx
  margin-left: 3rem
.q-tab
  min-height: 0 !important
</style>
