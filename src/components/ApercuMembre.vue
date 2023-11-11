<template>
  <q-expansion-item v-if="mb" :class="dkli(idx)"
    switch-toggle-side expand-separator dense group="trgroup">
    <template v-slot:header>
      <div class="column">
        <apercu-genx v-if="people" :na="mb.na" :cv="mb.cv" :ids="mb.ids" :idx="idx" detail-people/>
        <div v-else class="row justify-between">
          <div>
            <span class="titre-lg text-bold text-primary">{{$t('moi2', [mb.na.nom])}}</span>
            <span class="q-ml-lg font-mono fs-sm">{{'#' + mb.na.id}}</span>
          </div>
          <bouton-membre v-if="!nopanel" :eg="eg" :im="mb.ids" btn/>
        </div>
        <div>
          <span class="titre-md text-bold">{{$t('AMm' + stm)}}</span>
          <span v-if="eg.groupe.estHeb(mb.ids)" class="q-ml-sm titre-md text-bold text-warning">{{$t('AMmh')}}</span>
          <span v-if="mb.ids === 1" class="q-ml-sm titre-md text-bold text-warning">{{$t('AMmf')}}</span>
          <span v-if="eg.groupe.accesMembre(mb.ids)" class="q-ml-sm titre-md">- {{$t('AMmm')}}</span>
          <span v-if="ano !== 0" class="q-ml-sm titre-md">- {{$t('AMn' + ano)}}</span>
        </div>
      </div>
    </template>

    <div>
      <div class="q-ml-lg" style="position:relative">
        <div v-if="dac===0" class="text-italic">{{$t('AMdac0')}}</div>
        <div v-if="dac>1" class="text-italic">{{$t('AMdacd', xd(d))}}</div>

        <div v-if="stm===0 && eg.groupe.msu !== null && mb.flagsiv">
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

        <div v-if="stm <= 1" class="text-italic">
          <span v-if="damh===0">{{$t('AMdam0')}}</span>
          <span v-if="damh>1">{{$t('AMdamd', [xd(damh)])}}</span>
        </div>
        <div v-if="stm <= 1" class="text-italic">{{$t('AMacnoh' + (dnh ? '' : '0'), dnh)}}</div>
        <div v-if="stm <= 1" class="text-italic">
          <span v-if="!mb.ddi">{{$t('AMinv0')}}</span>
          <span v-else>{{$t('AMinvd', [xd(mb.ddi)])}}</span>
        </div>
        <div v-if="stm === 1" class="text-italic">
          <span>{{$t('AMinvit')}}</span>
          <span v-if="fl & FLAGS.PA" class="q-ml-sm">- {{$t('AMinvan')}}</span>
          <span v-if="fl & FLAGS.DM" class="q-ml-sm">- {{$t('AMinvam')}}</span>
          <span v-if="(fl & FLAGS.DN) && !(fl & FLAGS.DE)" class="q-ml-sm">- {{$t('AMinvln')}}</span>
          <span v-if="fl & FLAGS.DE" class="q-ml-sm">- {{$t('AMinven')}}</span>
        </div>

        <div v-if="stm === 2 || stm === 3" class="text-italic">
          <span v-if="dam===0">{{$t('AMdam0')}}</span>
          <span v-if="dam===1">{{$t('AMdam1')}}</span>
          <span v-if="dam>1">{{$t('AMdamd', [xd(dam)])}}</span>
          <span v-if="ambna" class="q-ml-sm">
            <span>{{$t('AMacmb')}}</span>
            <q-btn size="sm" dense :label="$t('activer')" color="primary" @click="activeramb"/>
          </span>
          <span v-else class="q-ml-sm">
            <q-btn size="sm" dense :label="$t('desactiver')" color="warning" @click="desactiveramb"/>
          </span>
        </div>

        <div v-if="stm === 2 || stm === 3" class="text-italic">
          <span>{{$t('AMacno', dn)}}</span>
          <span v-if="anona" class="q-ml-sm">
            <span>{{$t('AMacno' + anona)}}</span>
            <q-btn size="sm" dense :label="$t('activer')" color="primary" @click="activerano"/>
          </span>
          <span v-else class="q-ml-sm">
            <q-btn size="sm" dense :label="$t('desactiver')" color="warning" @click="desactiverano"/>
          </span>
        </div>

        <bouton-bulle2 v-if="fl" :texte="edit(fl, $t, '\n\n')" :label="$t('details')"
          class="btnb"/>
      </div>
      <div class="row q-gutter-sm">
        <q-btn v-if="eg.estAnim && invitable" :label="$t('AMinvitbtn')" icon="add" dense size="sm" align="sm"
          @click="ouvririnvit"/>
      </div>
    </div>

    <q-dialog v-model="invit" persistent>
      <q-card class="bs">
        <q-header elevated class="bg-secondary text-white">
          <q-toolbar>
            <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
            <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('AMinvtit', [mb.na.nom, eg.groupe.na.nom])}}</q-toolbar-title>
            <bouton-help page="page1"/>
          </q-toolbar>
        </q-header>

        <q-card-section v-if="stm===0 && eg.groupe.msu !== null && mb.flagsiv">
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
          <q-select class="q-mb-md" v-model="invpar" :options="options" :label="$t('AMinvpar')" />
          <q-checkbox v-model="inv.pa" :label="$t('FLAGS7')" />
          <q-checkbox v-model="inv.dm" :label="$t('FLAGS3')" />
          <q-checkbox v-model="inv.dn" :label="$t('FLAGS5')" />
          <q-checkbox v-if="inno" v-model="inv.de" :label="$t('FLAGS6')" />
        </q-card-section>
        <q-card-actions vertical>
          <q-btn flat :label="$t('renoncer')" color="primary" @click="MD.fD"/>
          <q-btn v-if="!eg.groupe.msu" flat :label="$t('AMinviter')" color="primary" @click="inviter(1)"/>
          <q-btn v-if="!eg.groupe.msu" flat :label="$t('AMdelinv')" color="warning" @click="inviter(2)"/>
          <q-btn v-if="eg.groupe.msu" :label="$t('AMvpour')" color="primary" @click="inviter(3)"/>
          <q-btn v-if="eg.groupe.msu" :label="$t('AMvcontre')" color="warning" @click="inviter(4)"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-expansion-item>
</template>
<script>
import { ref, toRef } from 'vue'

import { dkli, $t } from 'src/app/util.mjs'
import { AMJ, edit } from '../app/api.mjs'
import stores from '../stores/stores.mjs'
// import BoutonConfirm from './BoutonConfirm.vue'
import BoutonMembre from './BoutonMembre.vue'
import ApercuGenx from './ApercuGenx.vue'
import BoutonHelp from './BoutonHelp.vue'
import BoutonBulle2 from './BoutonBulle2.vue'
import { MD } from '../app/modele.mjs'
import { StatutMembre, InvitationGroupe } from '../app/operations.mjs'

export default {
  name: 'ApercuMembre',

  props: { 
    mb: Object,
    eg: Object,
    mapmc: Object,
    idx: Number, 
    people: Boolean,
    nopanel: Boolean // Ne pas mettre le bouton menant à PanelMembre
  },

  components: { BoutonHelp, ApercuGenx, BoutonMembre, BoutonBulle2 },

  computed: {
    amb () { return this.gSt.ambano[0] },

    stm () { return this.eg.groupe.statutMajeur(this.mb.ids) },

    ano () { return this.eg.groupe.accesNote(this.mb.ids) },

    // accès aux notes autorisé MAIS NON activé
    anona () { return this.eg.groupe.accesNoteNA(this.mb.ids) },

    // accès aux membres autorisé MAIS NON activé
    ambna () { return this.eg.groupe.accesMembreNA(this.mb.ids) },

    fl () { return this.eg.groupe.flags[this.mb.ids] },

    dn () {
      const dl = this.mb.dln || 0
      const de = this.mb.dln || 0
      const an = this.eg.groupe.accesNote(this.mb.ids)
      if (an === 1) return [$t('oui'), $t('non')]
      if (an === 2) return [$t('oui'), $t('oui')]
      return [dl ? $t('pasdepuis', [this.xd(dl)]) : $t('jamais'),
        de ? $t('pasdepuis', [this.xd(de)]) : $t('jamais') ]
    },

    dnh () {
      const dl = this.mb.dln || 0
      const de = this.mb.dln || 0
      const an = this.eg.groupe.accesNoteH(this.mb.ids)
      if (an === 0) return 0
      return [dl ? $t('pasdepuis', [this.xd(dl)]) : $t('jamais'),
        de ? $t('pasdepuis', [this.xd(de)]) : $t('jamais') ]
    },

    damh () {
      const d = this.mb.dam || 0
      const am = this.eg.groupe.accesMembreH(this.mb.ids)
      if (am) return 1
      return d ? d : 0
    },

    dam () {
      const d = this.mb.dam || 0
      const am = this.eg.groupe.accesMembre(this.mb.ids)
      if (am) return 1
      return d ? d : 0
    },

    dac () {
      const d = this.mb.dac || 0
      const ac = this.eg.groupe.estActif(this.mb.ids)
      if (ac) return 1
      return d
    },

    invitable () { return this.eg.groupe.estActif(this.mb.ids) },

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

    ro () { 
      if (this.mb.estAc) {
        const d = this.session.edit(true)
        return d || ''
      }
      if (!this.eg.estAnim) return this.$t('AMpasanst1')
      if (this.st === 32) return this.$t('AMpasanst2')
      return ''
    },
  },

  /*
  1 - invitation
  2 - modification d'invitation
  3 - acceptation d'invitation
  4 - refus d'invitation
  5 - modification du rôle laa (actif)
  6 - résiliation
  7 - oubli
  */

  data () { return {
    inv: null,
    invpar: null,
    options: null,

    action: false,
    fn: 0, // fonction à effectuer
    laa: 0, // 0:lecteur, 1:auteur, 2:animateur
    err1: '',
    err2: '',
    ardoise: ''
  }},

  methods: {
    xd (d) { return !d ? '-' : AMJ.editDeAmj(d, true) },

    ouvrirdetails () {
      this.session.setPeopleId(this.mb.na.id)
      MD.oD('detailspeople')
    },
    activernano () { },
    desactivernano () { },
    activeramb () { },
    desactiveramb () { },

    async ouvririnvit () {
      if (!await this.session.edit()) return
      if (this.eg.groupe.enListeNoire(this.mb.nag)) {
        afficherDiag($t('AMlnoire'))
        return
      }
      this.options = this.gSt.animAvcIms(this.eg)
      this.invpar = this.options[0]
      const fl = this.mb.flagsiv || 0
      this.inv = { 
        pa: (fl & FLAGS.PA) === 0,
        dm: (fl & FLAGS.DM) === 0,
        dn: (fl & FLAGS.DN) === 0,
        de: (fl & FLAGS.DE) === 0
      } 
      this.ovinvit()
    },

    async inviter (op) { //1:inviter 2:suppr invit 3:pour 4:contre
      let nvinv = 0
      if (this.inv.pa) nvinv |= FLAGS.PA
      if (this.inv.dm) nvinv |= FLAGS.DM
      if (this.inv.de) nvinv |= FLAGS.DE | FLAGS.DN
      else if (this.inv.dn) nvinv |= FLAGS.DN
      await new InvitationGroupe().run(op, this.eg.groupe, this.mb, this.invpar.value, nvinv)
    },

    // PURGATOIRE
    async setAc (fn, laa) {
      // Contrôles fins
      this.err1 = '' // bloquantes
      this.err2 = '' // pas bloquantes
      if (fn === 6 && this.st === 32 ) {
        if (this.gSt.animIds(this.gSt.egrC).size === 1) this.err2 = this.$t('AMdan2')
      }
      this.action = false
      this.fn = fn
      this.laa = laa
      setTimeout(() => { this.action = true }, 200)
    },
    async changeSt () {
      this.action = false
      this.session.setMembreId(this.mb.ids)
      this.ovchgSt()
    },
    async actionSt () {
      this.action = false
      this.err1 = ''
      this.err2 = ''
      // MD.fD() // ???
      /* 
        gr: groupe
        mb: membre
        fn: fonction à appliquer
        laa: lecteur, auteur, animateur
        ard: texte de l'ardoise, null s'il n'a pas changé
      */
      const ard = this.eg.groupe.ard === this.ardoise ? null : this.ardoise
      const code = await new StatutMembre().run(this.eg.groupe, this.mb, this.fn, this.laa, ard)
      if (this.code) {
        await afficherDiag(this.$t('AMx' + code))
      }
      this.closeSt()
    },
    closeSt () {
      MD.fD()
      this.action = false
      this.err1 = ''
      this.err2 = ''
    }
  },

  setup (props) {
    const session = stores.session
    const gSt = stores.groupe

    // const mb = toRef(props, 'mb')
 
    const chgSt = ref(false)
    function ovchgSt () { MD.oD(chgSt) }
    const invit = ref(false)
    function ovinvit () { MD.oD(invit) }

    return {
      MD, dkli, edit, chgSt, ovchgSt, invit, ovinvit,
      session,
      gSt
    }
  }
}
</script>
<style lang="css">
.q-item__section--side { padding-right: 5px !important; }
</style>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.bordb
  border-bottom: 1px solid $grey-5
.nom
  max-height: 1.3rem
  overflow: hidden
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.btn1
  padding: 1px !important
  width: 1.5rem !important
.btnb
  position: absolute
  top: 0
  right: 0
</style>
