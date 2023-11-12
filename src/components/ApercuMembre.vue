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
        <div v-if="dac === 0" class="text-italic">{{$t('AMdac0')}}</div>
        <div v-if="dac > 1" class="text-italic">{{$t('AMdacd', xd(d))}}</div>

        <div v-if="stm <= 1">
          <div class="text-italic">
            <span v-if="damh===0">{{$t('AMdam0')}}</span>
            <span v-if="damh>1">{{$t('AMdamd', [xd(damh)])}}</span>
          </div>
          <div class="text-italic">{{$t('AMacnoh' + (dnh ? '' : '0'), dnh)}}</div>
          <div class="text-italic">
            <span v-if="!mb.ddi">{{$t('AMinv0')}}</span>
            <span v-else>{{$t('AMinvd', [xd(mb.ddi)])}}</span>
          </div>
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

            <q-btn v-if="stm===0 && eg.groupe.msu === null" icon="add" dense size="sm" color="primary"
              :label="$t('AMinvitbtn1')" @click="ouvririnvit(1)"/>

            <q-btn v-if="stm===1 && eg.groupe.msu === null" icon="edit" dense size="sm" color="primary"
              :label="$t('AMinvitbtn2')" @click="ouvririnvit(2)"/>
            <q-btn v-if="stm===1 && eg.groupe.msu === null" class="q-ml-sm" icon="delete" dense size="sm" color="primary"
              :label="$t('AMinvitbtn3')" @click="ouvririnvit(3)"/>

            <div v-if="eg.groupe.msu !== null && mb.flagsiv">
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

            <q-btn v-if="stm===0 && eg.groupe.msu !== null" icon="how_to_vote" dense size="sm" color="primary"
              :label="$t('AMinvitbtn4')" @click="ouvririnvit(4)"/>

            <q-btn v-if="stm===1 && eg.groupe.msu !== null" icon="how_to_vote" dense size="sm" color="primary"
              :label="$t('AMinvitbtn3')" @click="ouvririnvit(6)"/>
          </div>
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
        <q-btn v-if="eg.estAnim && invitable" :label="$t('AMinvitbtn')" icon="add" dense size="sm"
          @click="ouvririnvit"/>
      </div>
    </div>

    <q-dialog v-model="invit" persistent>
      <q-card class="bs moyennelargeur">
        <q-toolbar class="bg-secondary text-white">>
          <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('AMinvtit', [mb.na.nom, eg.groupe.na.nom])}}</q-toolbar-title>
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
            <span v-if="cas === 4 && gst.animInv[0].indexOf(invpar.value) !== -1"
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
        <q-card-actions vertical>
          <q-btn flat :label="$t('renoncer')" color="primary" @click="MD.fD"/>
          <q-btn v-if="cas === 1" flat :label="$t('AMinviter')" color="primary" @click="inviter(1)"/>
          <q-btn v-if="cas === 2" :disable="mb.flagsiv === nvflags"
            flat :label="$t('AMmodinv')" color="primary" @click="inviter(2)"/>
          <q-btn v-if="cas === 3" flat :label="$t('AMdelinv')" color="warning" @click="inviter(3)"/>
          <q-btn v-if="cas === 4" :label="$t('AMvpour')" :color="mb.flagsiv === nvflags ? 'primary' : 'warning'" 
            :disable="gst.animInv[0].indexOf(invpar) !== -1 && mb.flagsiv === nvflags" @click="inviter(4)"/>
          <q-btn v-if="cas === 4" :label="$t('AMvcontre')" :color="mb.flagsiv === nvflags ? 'primary' : 'warning'" 
            :disable="gst.animInv[1].indexOf(invpar) !== -1" @click="inviter(5)"/>
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
    
    enLNA () { return this.eg.groupe.enLNA(this.mb.ids) },
    enLNC () { return this.eg.groupe.enLNC(this.mb.ids) },

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

    invitable () { return this.eg.groupe.estInvitable(this.mb.ids) },

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

    drupd () { return this.cas < 3 || this.cas === 4 && this.cas === 5 },
    
  },

  data () { return {
    /* 
    1: invit std, 2: modif invit std, 3: suppr invit std, 
    4: vote pour, 5: vote contre, 6: suppr invit una 
    */
    cas: 0,
    ipa: false, idm: false, idn: false, ide: false,
    invpar: null,
    options: null
  }},

  methods: {
    xd (d) { return !d ? '-' : AMJ.editDeAmj(d, true) },

    ouvrirdetails () {
      this.session.setPeopleId(this.mb.na.id)
      MD.oD('detailspeople')
    },
    activerano () { },
    desactiverano () { },
    activeramb () { },
    desactiveramb () { },

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
      this.options = this.gSt.animAvcIms(this.eg)
      this.invpar = this.options[0]
      this.ovinvit()
    },

    async inviter (cas) { 
      /* 
      1: invit std, 2: modif invit std, 3: suppr invit std, 
      4: vote pour, 5: vote contre, 6: suppr invit una 
      */
      await new InvitationGroupe().run(cas, this.eg.groupe, this.mb, this.invpar.value, this.nvflags)
      MD.fD()
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
      MD, FLAGS, dkli, edit, chgSt, ovchgSt, invit, ovinvit,
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
.lgsel
  width: 10rem
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.btnb
  position: absolute
  top: 0
  right: 0
</style>
